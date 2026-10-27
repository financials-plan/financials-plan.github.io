# Công thức đang chạy trong ứng dụng

Mã nguồn: thư viện `FinancialMath` và các hàm phụ trợ trong [`js/script.js`](../../js/script.js).
Đơn vị tiền: triệu đồng. Mọi lợi suất là **giả định kỳ vọng**, không phải lợi nhuận được bảo đảm.

## 1. Khoản góp hằng tháng của mục tiêu đầu tư (khớp bảng tính gốc)

Mặc định (`FinancialMath.PMT_CONVENTION = 'excel_monthly'`):

```
R̄ = Σ w_p · R_p                    (lãi suất mục tiêu = bình quân gia quyền lợi suất các sản phẩm đã chọn)
r  = R̄ / 12,   N = 12 · (năm kết thúc − năm bắt đầu + 1)
A  = max(0, (S − B₀(1+r)^N) · r / ((1+r)^N − 1))          (r = 0 thì (S − B₀)/N)
```

- `S`: vốn cần có tại năm hoàn tất; `B₀`: số tiền đã tích lũy.
- Tổng tỷ trọng khác 100% hoặc sản phẩm không còn trong danh mục → trạng thái lỗi, khoản góp = 0.
- Ví dụ (đã kiểm thử, `tests/portfolio.test.js`): Du lịch 50 triệu/4 năm ra 0,8755; Quỹ dự phòng 100/4 năm ra 1,6853; Đám cưới 200/7 năm ra 1,6066; Khởi nghiệp 500/5 năm ra 6,8940; Mua chung cư 1.500/13 năm ra 2,9006 triệu/tháng.
- Đổi `PMT_CONVENTION` thành `'annual'` để dùng quy ước góp dồn 12A cuối năm với lãi hiệu dụng năm (khớp tuyệt đối với bảng số dư).

> Lưu ý: khoản góp tính theo lãi tháng nhưng bảng số dư (mục 3) cộng dồn theo năm, nên số dư cuối kỳ của mô phỏng thấp hơn mục tiêu khoảng vài phần trăm. Đây là hệ quả của việc giữ công thức khoản góp giống bảng tính gốc.

## 2. Quy ước số dư theo năm

`F(Y) = ((1+R)^Y − 1) / R` chỉ dùng khi chọn `'annual'`; bảng số dư luôn tính theo năm (mục 3).

## 3. Mô phỏng số dư danh mục

Mỗi sản phẩm của mỗi mục tiêu, tại cuối năm:

```
B_năm = B_(năm−1) · (1 + R_p) + 12 · A · w_p        (trong các năm góp)
```

- Mục tiêu bắt đầu muộn thì chưa có số dư ở các năm trước.
- Khi mục tiêu kết thúc: **Chi vốn** → số dư về 0 trong trạng thái cuối năm đó; **Giữ đầu tư** (mặc định cho Hưu trí) → tiếp tục sinh lời, không góp thêm.
- Tỷ trọng nhóm = số dư nhóm ÷ tổng số dư; nhóm theo trường **Loại đầu tư** của sản phẩm: Cổ phiếu, Trái phiếu, Bảo hiểm, Tiền gửi, và "Chưa xác định".
- **Mức sinh lời cần thiết** (cột ở Cân đối lộ trình) = Σ (số dư sản phẩm ÷ tổng số dư) × lợi suất sản phẩm. Đây là bình quân gia quyền lợi suất kỳ vọng của danh mục đã chọn, không phải mức tối thiểu để đạt mục tiêu.

Chưa đủ dữ liệu (không có mục tiêu hợp lệ) → bảng hiển thị "—", không dùng tỷ trọng mẫu.

## 4. Thu nhập cần đáp ứng khoản góp mục tiêu

```
Tổng góp(năm) = Σ A_j của các mục tiêu đang góp trong năm đó
Thu nhập cần = Tổng góp / Tỷ lệ tiết kiệm mục tiêu
```

- Chỉ là thu nhập để khoản góp chiếm đúng tỷ lệ tiết kiệm, **chưa gồm chi phí sinh hoạt và nợ**.
- Tỷ lệ tiết kiệm 0% mà có khoản góp → "Không khả thi". Tỷ lệ 0% được giữ nguyên, không đổi thành 35%.
- Khi có chi phí `E` và nợ `D`: `I_min = max(E + D + G, (E + D)/(1 − S))`.

## 5. Mục tiêu cố định

| Mục tiêu | Cách tính vốn cần có |
|---|---|
| Hưu trí | Giá trị hiện tại của chi tiêu hưu trí hằng tháng × 12 trong `số năm nghỉ hưu` (lợi suất giai đoạn nghỉ hưu, mặc định 6,5%/năm) + số tiền để lại cuối đời chiết khấu về lúc nghỉ hưu. Số kỳ tính theo **năm**. Chỉ tự tính khi người dùng nhập thông số hưu trí; nếu gõ trực tiếp "Mục tiêu tiết kiệm cần đạt" thì giữ giá trị đó. |
| Quỹ dự phòng Tài chính | Giá trị hiện tại của khoản chi định kỳ theo tháng trong số tháng đã nhập (lãi tháng hiệu dụng) + số tiền để lại sau cùng. |
| Khoản nợ | Niên kim trả dần: `PMT = P·r/(1 − (1+r)^−n)`, `r = lãi năm/12`. |

Lạm phát hiện **chưa được tính** (cờ `INFLATION_ENABLED = false`); giá trị mục tiêu nhập theo số tiền danh nghĩa.

## 6. Chênh lệch lũy kế (biểu đồ thu – chi)

`Chênh lệch lũy kế(m) = Chênh lệch lũy kế(m−1) + |kế hoạch − thực tế|` — luôn không giảm. Bảng số liệu vẫn có chênh lệch ròng có dấu.

## 7. Kiểm thử công thức

`tests/portfolio.test.js` đối chiếu từng công thức với phép tính độc lập, gồm ví dụ báo cáo
(Đám cưới, năm thứ 5: ETFFINLEAD 38,99; Trái phiếu 59,44; Tiền gửi 21,31). Chạy `npm test`.
