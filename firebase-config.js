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

// Thông số cấu hình chính xác từ Firebase Console của bạn
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
const DEFAULT_DOC_ID = "main_financial_record";

// Đóng gói các hàm thao tác đám mây vào window.CloudDB
window.CloudDB = {
  /**
   * Lưu toàn bộ trạng thái AppState lên Cloud Firestore
   */
  saveData: async (data, docId = DEFAULT_DOC_ID) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      const cleanData = JSON.parse(JSON.stringify(data));
      cleanData._lastUpdated = new Date().toISOString();
      
      await setDoc(docRef, cleanData);
      return { success: true };
    } catch (error) {
      console.error("Lỗi khi lưu lên Firestore:", error);
      return { success: false, error };
    }
  },

  /**
   * Đọc dữ liệu từ Cloud Firestore
   */
  loadData: async (docId = DEFAULT_DOC_ID) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { success: true, data: snapshot.data() };
      } else {
        return { success: false, notFound: true };
      }
    } catch (error) {
      console.error("Lỗi khi đọc từ Firestore:", error);
      return { success: false, error };
    }
  },

  /**
   * Lắng nghe cập nhật thời gian thực (Realtime Snapshot)
   */
  subscribeData: (onUpdateCallback, docId = DEFAULT_DOC_ID) => {
    const docRef = doc(db, COLLECTION_NAME, docId);
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
