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
   * @param {Object} data - Dữ liệu AppState cần lưu
   * @param {string} docId - Định danh tài liệu Firestore của người dùng
   * @param {Object} userMeta - Thông tin nhận diện người dùng đính kèm
   */
  saveData: async (data, docId, userMeta = null) => {
    try {
      const targetDocId = docId || LEGACY_DOC_ID;
      const docRef = doc(db, COLLECTION_NAME, targetDocId);
      const cleanData = JSON.parse(JSON.stringify(data));
      
      // Đính kèm metadata nhận diện người dùng và thời gian cập nhật
      cleanData._lastUpdated = new Date().toISOString();
      if (userMeta) {
        cleanData._userMeta = {
          rawName: userMeta.rawName || "",
          normalizedName: userMeta.normalizedName || "",
          userDocId: targetDocId,
          lastSavedAt: new Date().toISOString()
        };
      }

      await setDoc(docRef, cleanData);
      return { success: true, docId: targetDocId };
    } catch (error) {
      console.error("Lỗi khi lưu lên Firestore:", error);
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
