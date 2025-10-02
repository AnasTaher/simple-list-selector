// --- DOM References ---
const list = document.getElementById("ranked-list");
const addBtn = document.getElementById("add-item");
const layoutSelect = document.getElementById("layout-select");
const importCSV = document.getElementById("import-csv");
const itemForm = document.getElementById("item-form");
const itemFormFields = document.getElementById("item-form-fields");
const cancelFormBtn = document.getElementById("cancel-form");

let counter = 1;
let editingItem = null;

// =========================
// Item Creation & Rendering
// =========================

function createListItem(fields, index) {
    const li = document.createElement("li");
  
    // --- Drag handle ---
    const dragHandle = document.createElement("span");
    dragHandle.className = "drag-handle";
    dragHandle.textContent = "⋮⋮";
    li.appendChild(dragHandle);
  
    // --- Number (editable) ---
    const numberSpan = document.createElement("span");
    numberSpan.className = "item-number";
    numberSpan.textContent = index;
  
    numberSpan.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "number";
      input.value = numberSpan.textContent;
      input.style.width = "50px";
  
      input.addEventListener("blur", () => {
        let newVal = parseInt(input.value, 10);
        if (!isNaN(newVal) && newVal > 0) {
          moveItemToPosition(li, newVal);
        }
        updateNumbers();
        numberSpan.style.display = "";
        input.remove();
      });
  
      numberSpan.style.display = "none";
      numberSpan.parentNode.insertBefore(input, numberSpan);
      input.focus();
    });
  
    li.appendChild(numberSpan);
  
    // --- Fields container ---
    const fieldsContainer = document.createElement("div");
    fieldsContainer.className = "item-fields";
  
    fields.forEach((field) => {
      const span = document.createElement("span");
      span.className = "item-field";
      span.textContent = field;
  
      // Click to edit field
      span.addEventListener("click", () => {
        const currentData = [...fieldsContainer.querySelectorAll(".item-field")]
          .map(s => s.textContent);
        showItemForm(currentData, li);
      });
  
      fieldsContainer.appendChild(span);
    });
  
    li.appendChild(fieldsContainer);
  
    // --- Remove button ---
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✖";
    removeBtn.className = "remove-btn";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      li.remove();
      updateNumbers();
    });
    li.appendChild(removeBtn);
  
    // --- Dragging logic only on handle ---
    dragHandle.setAttribute("draggable", "true");
    dragHandle.addEventListener("dragstart", (e) => {
      draggedItem = li;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
  
    dragHandle.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      draggedItem = null;
      updateNumbers();
    });
  
    return li;
  }
  
  function moveItemToPosition(item, position) {
    const items = [...list.querySelectorAll("li")];
    const targetIndex = Math.min(Math.max(position - 1, 0), items.length - 1);
    list.insertBefore(item, items[targetIndex]);
    updateNumbers();
  }
    

function updateNumbers() {
  const items = list.querySelectorAll("li");
  items.forEach((item, i) => {
    item.querySelector(".item-number").textContent = `${i + 1}.`;
  });
  counter = items.length + 1;
}

// =========================
// Form Handling
// =========================

function showItemForm(existingData = [], item = null) {
  const numCols = parseInt(layoutSelect.value, 10);
  itemFormFields.innerHTML = "";
  editingItem = item;

  for (let i = 0; i < numCols; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Column ${i + 1}`;
    input.value = existingData[i] || "";
    itemFormFields.appendChild(input);
  }

  itemForm.classList.remove("hidden");
}

function hideItemForm() {
  itemForm.classList.add("hidden");
  itemFormFields.innerHTML = "";
  editingItem = null;
}

itemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = itemFormFields.querySelectorAll("input");
  const fields = [...inputs].map(inp => inp.value.trim());
  if (fields.every(f => f === "")) return;

  if (editingItem) {
    // Update existing
    const fieldSpans = editingItem.querySelectorAll(".item-field");
    fieldSpans.forEach((span, idx) => {
      span.textContent = fields[idx] || "";
    });
  } else {
    // Add new
    const li = createListItem(fields, counter);
    list.appendChild(li);
  }

  updateNumbers();
  hideItemForm();
});

addBtn.addEventListener("click", () => showItemForm());
cancelFormBtn.addEventListener("click", () => hideItemForm());

// =========================
// Drag & Drop
// =========================

let draggedItem = null;

list.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "LI") {
    draggedItem = e.target;
    e.target.classList.add("dragging");
  }
});

list.addEventListener("dragend", (e) => {
  if (e.target.tagName === "LI") {
    e.target.classList.remove("dragging");
    draggedItem = null;
    updateNumbers();
  }
});

list.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(list, e.clientY);
  if (afterElement == null) {
    list.appendChild(draggedItem);
  } else {
    list.insertBefore(draggedItem, afterElement);
  }
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// =========================
// Layout & CSV
// =========================

layoutSelect.addEventListener("change", (e) => {
  list.className = `list columns-${e.target.value}`;
});

importCSV.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const numCols = parseInt(layoutSelect.value, 10);
  const reader = new FileReader();

  reader.onload = function (event) {
    const lines = event.target.result
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    list.innerHTML = "";
    lines.forEach((line, i) => {
      const fields = line.split(",").slice(0, numCols);
      const li = createListItem(fields, i + 1);
      list.appendChild(li);
    });

    updateNumbers();
  };

  reader.readAsText(file);
});
