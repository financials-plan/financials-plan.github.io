/**
 * FIREBASE FIRESTORE SERVICE (Modular SDK v10)
 * Dùng CDN ES Modules - chạy trực tiếp trên web tĩnh GitHub Pages
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Thông số cấu hình chính xác từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB8i-2ZXZkr7Nmt8c5hVrjBah6-bxfj9PQ",
  authDomain: "financials-plan.firebaseapp.com",
  projectId: "financials-plan",
  storageBucket: "financials-plan.firebasestorage.app",
  messagingSenderId: "850636237701",
  appId: "1:850636237701:web:1902eff807d2762415f2ec",
  measurementId: "G-SEB30RQ8ZS"
};

// Khởi tạo Firebase App và Cloud Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = "financial_data";
const LEGACY_DOC_ID = "main_financial_record";

// Đóng gói các hàm thao tác đám mây vào window.CloudDB
window.CloudDB = {
  /**
   * Kiểm tra một Document ID đã tồn tại trên Firestore hay chưa
   * @param {string} docId - ID tài liệu cần kiểm tra
   */
  checkDocExists: async (docId) => {
    try {
      if (!docId) return { success: false, exists: false };
      const docRef = doc(db, COLLECTION_NAME, docId);
      const snapshot = await getDoc(docRef);
      return { success: true, exists: snapshot.exists(), data: snapshot.exists() ? snapshot.data() : null };
    } catch (error) {
      console.error("Lỗi khi kiểm tra document trên Firestore:", error);
      return { success: false, exists: false, error };
    }
  },

  /**
   * Lưu toàn bộ trạng thái AppState lên Cloud Firestore theo Document ID chỉ định
   * Đồng thời lưu bản sao lưu tuần tự (Backup 1, Backup 2,...) kèm timestamp thực tế
   * @param {Object} data - Dữ liệu AppState cần lưu
   * @param {string} docId - Định danh tài liệu Firestore của người dùng
   * @param {Object} userMeta - Thông tin nhận diện người dùng đính kèm
   */
  saveData: async (data, docId, userMeta = null) => {
    try {
      const targetDocId = docId || LEGACY_DOC_ID;
      const docRef = doc(db, COLLECTION_NAME, targetDocId);
      const cleanData = JSON.parse(JSON.stringify(data));
      
      // Đọc bản ghi hiện tại để bảo toàn và nối tiếp danh sách _backups
      let existingBackups = [];
      try {
        const currentSnap = await getDoc(docRef);
        if (currentSnap.exists()) {
          const currentDoc = currentSnap.data();
          if (Array.isArray(currentDoc._backups)) {
            existingBackups = currentDoc._backups;
          } else if (currentDoc._lastUpdated) {
            existingBackups = [{
              id: "bk_initial_" + targetDocId,
              name: "Backup 1",
              timestamp: currentDoc._lastUpdated,
              summary: {
                year: currentDoc.currentYear || new Date().getFullYear(),
                age: currentDoc.currentAge || 25,
                goalsCount: (currentDoc.tcGoals || []).length,
                planIncomeTotal: (currentDoc.planIncome || []).reduce((s, x) => s + (Number(x.plan) || 0), 0),
                planExpenseTotal: (currentDoc.planExpense || []).reduce((s, x) => s + (Number(x.plan) || 0), 0)
              },
              data: (() => {
                const d = JSON.parse(JSON.stringify(currentDoc));
                delete d._backups;
                delete d._userMeta;
                return d;
              })()
            }];
          }
        }
      } catch (e) {
        console.warn("Không thể đọc snapshot hiện tại từ Cloud, đọc từ bộ nhớ cục bộ:", e);
      }

      // Fallback từ localStorage nếu Cloud chưa có
      if (existingBackups.length === 0) {
        try {
          const localBk = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
          if (Array.isArray(localBk) && localBk.length > 0) existingBackups = localBk;
        } catch (e) {}
      }

      // Tạo bản sao lưu mới tuần tự
      const nextIndex = existingBackups.length + 1;
      const nowIso = new Date().toISOString();

      const dataSnapshot = JSON.parse(JSON.stringify(data));
      delete dataSnapshot._backups;
      delete dataSnapshot._userMeta;
      delete dataSnapshot._lastUpdated;

      const newBackupEntry = {
        id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: `Backup ${nextIndex}`,
        timestamp: nowIso,
        summary: {
          year: dataSnapshot.currentYear || new Date().getFullYear(),
          age: dataSnapshot.currentAge || 25,
          goalsCount: (dataSnapshot.tcGoals || []).length,
          planIncomeTotal: (dataSnapshot.planIncome || []).reduce((s, x) => s + (Number(x.plan) || 0), 0),
          planExpenseTotal: (dataSnapshot.planExpense || []).reduce((s, x) => s + (Number(x.plan) || 0), 0)
        },
        data: dataSnapshot
      };

      // Giữ tối đa 20 bản sao lưu gần nhất (mới nhất lên đầu)
      const updatedBackups = [newBackupEntry, ...existingBackups.filter(b => b.id !== newBackupEntry.id)].slice(0, 20);

      try {
        localStorage.setItem("FIN_APP_BACKUPS_" + targetDocId, JSON.stringify(updatedBackups));
      } catch (e) {}

      cleanData._backups = updatedBackups;
      cleanData._lastUpdated = nowIso;
      if (userMeta) {
        cleanData._userMeta = {
          rawName: userMeta.rawName || "",
          normalizedName: userMeta.normalizedName || "",
          userDocId: targetDocId,
          lastSavedAt: nowIso
        };
      }

      await setDoc(docRef, cleanData);
      return { success: true, docId: targetDocId, newBackup: newBackupEntry, backups: updatedBackups };
    } catch (error) {
      console.error("Lỗi khi lưu lên Firestore:", error);
      return { success: false, error };
    }
  },

  /**
   * Lấy danh sách các bản sao lưu của người dùng
   * @param {string} docId - Định danh tài liệu người dùng
   */
  getBackups: async (docId) => {
    const targetDocId = docId || LEGACY_DOC_ID;
    try {
      let backups = [];
      const docRef = doc(db, COLLECTION_NAME, targetDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data._backups) && data._backups.length > 0) {
          backups = data._backups;
        } else if (data._lastUpdated) {
          backups = [{
            id: "bk_initial_" + targetDocId,
            name: "Backup 1",
            timestamp: data._lastUpdated,
            summary: {
              year: data.currentYear || new Date().getFullYear(),
              age: data.currentAge || 25,
              goalsCount: (data.tcGoals || []).length,
              planIncomeTotal: (data.planIncome || []).reduce((s, x) => s + (Number(x.plan) || 0), 0),
              planExpenseTotal: (data.planExpense || []).reduce((s, x) => s + (Number(x.plan) || 0), 0)
            },
            data: (() => {
              const d = JSON.parse(JSON.stringify(data));
              delete d._backups;
              delete d._userMeta;
              return d;
            })()
          }];
        }
      }
      if (backups.length === 0) {
        try {
          const local = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
          if (Array.isArray(local) && local.length > 0) backups = local;
        } catch (e) {}
      }
      return { success: true, backups };
    } catch (error) {
      console.error("Lỗi khi đọc danh sách sao lưu từ Cloud:", error);
      try {
        const local = JSON.parse(localStorage.getItem("FIN_APP_BACKUPS_" + targetDocId) || "[]");
        if (Array.isArray(local) && local.length > 0) {
          return { success: true, backups: local, fromCache: true };
        }
      } catch (e) {}
      return { success: false, error };
    }
  },

  /**
   * Xóa một bản sao lưu cụ thể
   * @param {string} docId - Định danh tài liệu người dùng
   * @param {string} backupId - ID của bản sao lưu cần xóa
   */
  deleteBackup: async (docId, backupId) => {
    try {
      const targetDocId = docId || LEGACY_DOC_ID;
      const docRef = doc(db, COLLECTION_NAME, targetDocId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return { success: false, notFound: true };

      const docData = snap.data();
      let backups = Array.isArray(docData._backups) ? docData._backups : [];
      backups = backups.filter(b => b.id !== backupId);
      docData._backups = backups;

      try {
        localStorage.setItem("FIN_APP_BACKUPS_" + targetDocId, JSON.stringify(backups));
      } catch (e) {}

      await setDoc(docRef, docData);
      return { success: true, backups };
    } catch (error) {
      console.error("Lỗi khi xóa bản sao lưu:", error);
      return { success: false, error };
    }
  },

  /**
   * Đọc dữ liệu từ Cloud Firestore theo Document ID chỉ định
   * @param {string} docId - Định danh tài liệu người dùng
   */
  loadData: async (docId) => {
    try {
      const targetDocId = docId || LEGACY_DOC_ID;
      const docRef = doc(db, COLLECTION_NAME, targetDocId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.data(), docId: targetDocId };
      } else {
        return { success: false, notFound: true, docId: targetDocId };
      }
    } catch (error) {
      console.error("Lỗi khi đọc từ Firestore:", error);
      return { success: false, error };
    }
  },

  /**
   * Đọc dữ liệu từ bản ghi cũ legacy (main_financial_record) để phục vụ sao chép/kế thừa nếu cần
   */
  loadLegacyData: async () => {
    try {
      const docRef = doc(db, COLLECTION_NAME, LEGACY_DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.data() };
      }
      return { success: false, notFound: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Lắng nghe cập nhật thời gian thực (Realtime Snapshot) theo Document ID
   */
  subscribeData: (onUpdateCallback, docId) => {
    const targetDocId = docId || LEGACY_DOC_ID;
    const docRef = doc(db, COLLECTION_NAME, targetDocId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdateCallback(snapshot.data());
      }
    }, (error) => {
      console.error("Lỗi lắng nghe dữ liệu thời gian thực:", error);
    });
  }
};

// Bắn sự kiện sẵn sàng để script.js tự động nạp dữ liệu
window.dispatchEvent(new CustomEvent("firebase-ready"));
