document.getElementById("fillButton").addEventListener("click", async () => {
  const sttRaw = document.getElementById("questionId").value;
  const stt = parseInt(sttRaw);
  if (isNaN(stt)) {
    alert("Vui lòng nhập số thứ tự hợp lệ.");
    return;
  }

  const response = await fetch(chrome.runtime.getURL("questions3.json"));
  const data = await response.json();
  const cauhoi = data.find(q => q.stt === stt);

  if (!cauhoi) {
    alert("Không tìm thấy câu hỏi!");
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [cauhoi],
      func: (cauhoi) => {
        function simulateCleanTextEdit(editableDiv, text) {
          if (!editableDiv) return;
          editableDiv.focus();
          document.execCommand("selectAll", false, null);
          document.execCommand("insertText", false, text.trim());
          editableDiv.dispatchEvent(new Event("input", { bubbles: true }));
          editableDiv.dispatchEvent(new Event("blur"));
        }

        try {
          // 1. Điền tên câu hỏi dưới dạng "01", "02", ...
          const nameInput = document.querySelector("#id_name");
          if (nameInput) {
            nameInput.value = cauhoi.stt.toString().padStart(2, "0");
            nameInput.dispatchEvent(new Event("input", { bubbles: true }));
            nameInput.dispatchEvent(new Event("blur"));
          }

          // 2. Điền nội dung câu hỏi
          simulateCleanTextEdit(
            document.querySelector("#id_questiontexteditable"),
            cauhoi.noidung
          );

          // 3. Điền nội dung các đáp án
          const answers = [
            "#id_answer_0editable",
            "#id_answer_1editable",
            "#id_answer_2editable",
            "#id_answer_3editable"
          ];
          const keys = ["a", "b", "c", "d"];
          answers.forEach((selector, idx) => {
            simulateCleanTextEdit(
              document.querySelector(selector),
              cauhoi[keys[idx]]
            );
          });

          // 4. Gán đáp án đúng
          const correctIndex = { A: 0, B: 1, C: 2, D: 3 }[cauhoi.dapandung.toUpperCase()];
          for (let i = 0; i < 4; i++) {
            const select = document.querySelector(`#id_fraction_${i}`);
            if (select) {
              select.value = (i === correctIndex) ? "1.0" : "0.0";
              select.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }

        } catch (e) {
          alert("Lỗi khi điền dữ liệu: " + e.message);
        }
      }
    });
  });
});