from docx import Document
import json
import re

def extract_options_from_cell(cell):
    """Tách các phương án A–D từ ô cell trong bảng Word (bằng text gốc thay vì paragraphs)."""
    full_text = cell.text.strip()

    # Thêm newline trước mỗi nhãn A./B./C./D. để chuẩn hóa phân tách dòng
    full_text = re.sub(r'\s*([A-Da-d])[).:\-]\s*', r'\n\1. ', full_text)

    # Tách từng dòng
    lines = full_text.split("\n")

    options = {}
    current_key = None
    current_val = ""
    for line in lines:
        match = re.match(r'^([A-Da-d])[).:\-]?\s+(.*)', line.strip())
        if match:
            if current_key:
                options[current_key] = current_val.strip()
            current_key = match.group(1).lower()
            current_val = match.group(2).strip()
        else:
            if current_key:
                current_val += " " + line.strip()
    if current_key:
        options[current_key] = current_val.strip()

    return options

def parse_questions_from_table(docx_path, output_json_path):
    document = Document(docx_path)
    questions = []

    for table in document.tables:
        for row in table.rows[1:]:  # Bỏ dòng tiêu đề
            cells = row.cells
            try:
                stt = int(cells[0].text.strip())
                noidung = cells[1].text.strip()
                phuongan_dict = extract_options_from_cell(cells[3])  # Cột phương án ở vị trí 4 (index 3)
                dap_an = cells[4].text.strip().upper()               # Cột đáp án ở vị trí 5 (index 4)

                cau_hoi = {
                    "stt": stt,
                    "noidung": noidung,
                    "a": phuongan_dict.get("a", ""),
                    "b": phuongan_dict.get("b", ""),
                    "c": phuongan_dict.get("c", ""),
                    "d": phuongan_dict.get("d", ""),
                    "dapandung": dap_an
                }

                if len(phuongan_dict) == 4:
                    questions.append(cau_hoi)
                else:
                    print(f"⚠️ Câu {stt} thiếu phương án (có {sorted(phuongan_dict.keys())})")

            except Exception as e:
                print(f"❌ Lỗi dòng {cells[0].text.strip()}: {e}")
                continue

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Đã chuyển {len(questions)} câu hỏi hợp lệ sang {output_json_path}")

# Chạy thử
if __name__ == "__main__":
    input_docx = "cauhoichuong1.docx"
    output_json = "questions.json"
    parse_questions_from_table(input_docx, output_json)