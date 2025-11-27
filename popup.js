document.getElementById("fillButton").addEventListener("click", async () => {
  const sttRaw = document.getElementById("questionId").value;
  const stt = parseInt(sttRaw);
  if (isNaN(stt)) {
    alert("Vui lòng nhập số thứ tự hợp lệ.");
    return;
  }

  const response = await fetch(chrome.runtime.getURL("output/questions5.json"));
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
          const nameInput = document.querySelector("#id_name");
          if (nameInput) {
            nameInput.value = cauhoi.stt.toString().padStart(2, "0");
            nameInput.dispatchEvent(new Event("input", { bubbles: true }));
            nameInput.dispatchEvent(new Event("blur"));
          }

          simulateCleanTextEdit(
            document.querySelector("#id_questiontexteditable"),
            cauhoi.noidung
          );

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

document.getElementById("convertSlideUrl").addEventListener("click", () => {
  const tail = document.getElementById("videoTail").value.trim();
  if (!tail) {
    alert("Vui lòng dán đuôi đường dẫn video .mp4");
    return;
  }

  const fullVideoUrl = "https://cdn-storage-static.tmu.edu.vn/dhtm-lms-prod/" + tail;

const fullSlideUrl = fullVideoUrl
    // 1) Đổi thư mục /video/ hoặc /videochuong/ thành /slide/
    .replace(/\/(video|videochuong)\//gi, "/slide/")
    // 2) Đổi tiền tố tên file "/Video" (đứng trước số) thành "/Slide"
    .replace(/\/Video(?=\d)/, "/Slide")
    // 3) Đổi đuôi
    .replace(/\.mp4$/i, ".pdf");

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [fullSlideUrl],
      func: (url) => {
        const input = document.querySelector("#id_externalurl");
        if (!input) {
          alert("Không tìm thấy ô nhập URL");
          return;
        }

        input.value = url;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur"));
      }
    });
  });
});