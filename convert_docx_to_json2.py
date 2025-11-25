from docx import Document
import json
import re

def extract_options_from_text(text):
    """Tách phương án A-D từ đoạn văn bản trong cột riêng."""
    # Thêm newline trước A. B. C. D. để chuẩn hóa
    text = re.sub(r'\s*([A-D])[).:\-]\s+', r'\n\1. ', text.strip())
    lines = text.split('\n')

    options = {}
    current_key = None
    current_val = ""

    for line in lines:
        match = re.match(r'^([A-D])[).:\-]?\s+(.*)', line.strip())
        if match:
            if current_key:
                options[current_key.lower()] = current_val.strip()
            current_key = match.group(1)
            current_val = match.group(2).strip()
        else:
            if current_key:
                current_val += " " + line.strip()

    if current_key:
        options[current_key.lower()] = current_val.strip()

    return options

def parse_questions(docx_path, output_json_path):
    document = Document(docx_path)
    questions = []

    for table in document.tables:
        for row in table.rows[1:]:  # Bỏ dòng tiêu đề
            try:
                cells = row.cells
                stt_text = cells[0].text.strip()
                if not stt_text.isdigit():
                    continue

                stt = int(stt_text)
                noidung = cells[1].text.strip()           # Cột nội dung
                options_text = cells[2].text.strip()      # Cột phương án (index 2)
                dap_an = cells[3].text.strip().upper()    # Cột đáp án (index 3)

                options = extract_options_from_text(options_text)

                cau_hoi = {
                    "stt": stt,
                    "noidung": noidung,
                    "a": options.get("a", ""),
                    "b": options.get("b", ""),
                    "c": options.get("c", ""),
                    "d": options.get("d", ""),
                    "dapandung": dap_an
                }

                if all(cau_hoi[k] for k in ["a", "b", "c", "d"]):
                    questions.append(cau_hoi)
                else:
                    print(f"⚠️ Câu {stt} thiếu phương án (có {sorted(options.keys())})")

            except Exception as e:
                print(f"❌ Lỗi dòng STT={cells[0].text.strip()}: {e}")
                continue

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\nĐã chuyển {len(questions)} câu hỏi hợp lệ sang {output_json_path}")

# Chạy thử
if __name__ == "__main__":
    parse_questions("cauhoichuong1.docx", "questions1.json")