// Global variables & initialization

let todoLists = JSON.parse(localStorage.getItem("todo-lists")) || [{title: getDate(), items: [], notes: "", ID: 0}];
let nextID = Math.max(-1, ...todoLists.map((list) => list.ID)) + 1;
let currentList = todoLists[0];

document.getElementById("delete-list-button").onclick = deleteList;
document.getElementById("new-list-button").onclick = newList;
document.getElementById("sort-button").onclick = sort;
document.getElementById("new-todo-button").onclick = () => newTodo(currentList.items.findIndex((item) => item.tags.done));
document.getElementById("notes").oninput = (event) => save(currentList, {notes: event.target.value}, false); // Save, but don't re-render.
window.addEventListener("storage", (event) => load(JSON.parse(event.newValue)));

render();


// Functions


function deleteList () {
  if (todoLists.length === 1) { // Don't delete the last list, just clear all associated items.
    save(currentList, {title: "", items: [], notes: ""});
    document.querySelector("#todo-lists input").focus();
  } else {
    let pos = todoLists.indexOf(currentList);
    todoLists = todoLists.filter((list) => list !== currentList);
    save();
    setCurrentList(todoLists[Math.min(pos, todoLists.length - 1)]);
  }
}


function deleteTodo (todo) {
  save(currentList, {items: currentList.items.filter((item) => item !== todo)});
}


function handleKeyDown (todo, event) {
  let items = currentList.items;
  let index = items.indexOf(todo);
  if (event.key === "Enter") {
    newTodo(index + 1);
  } else if (event.key === " " && event.ctrlKey) {
    save(todo.tags, {done: !todo.tags.done});
    selectItem(index);    
  } else if (event.key === "Delete" && event.ctrlKey) {
    deleteTodo(todo);
  } else if (event.key === "Backspace" && todo.text === "") {
    deleteTodo(todo);
    selectItem(Math.max(index - 1, 0));
    event.preventDefault();
  } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    let newIndex = event.key === "ArrowUp" ? (index || items.length) - 1 : (items.indexOf(todo) + 1) % items.length;
    if (event.ctrlKey) {
      items[index] = items[newIndex];
      items[newIndex] = todo;
      save();
    }
    selectItem(newIndex);            
  }
}


function getDate () {
  let days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  let date = new Date();
  return `${days[date.getDay()]} ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}


function load (lists) {
  todoLists = lists;
  nextID = Math.max(-1, ...todoLists.map((list) => list.ID)) + 1;
  for (let list of todoLists) {
    if (list.ID === currentList.ID) {
      setCurrentList(list);
      return;
    }
  }
  setCurrentList(todoLists[0]);
}


function newList () {
  todoLists.unshift({
    title: getDate(),
    items: todoLists[0].items.filter((item) => !item.tags.done).map(({text, tags}) => ({text, tags: {...tags}})),
    notes: todoLists[0].notes,
    ID: nextID++
  });

  save();
  setCurrentList(todoLists[0]);
}


function newTodo (position) {
  let index = position === -1 ? currentList.items.length : position;
  currentList.items.splice(index, 0, {
    text: "",
    tags: {
      health: false,
      project: false,
      life: false,
      maintenance: false,
      entertainment: false,
      pinned: false,
      done: false
    }
  });

  save();
  selectItem(index);
}


function save (target, values, reRender = true) {
  if (target && values) {
    Object.assign(target, values);
  }
  localStorage.setItem("todo-lists", JSON.stringify(todoLists));
  if (reRender) {
    render();
  }
}


function selectItem (index) {
  document.getElementById("current-list").querySelectorAll(".todo-text")[index].focus();
}


function setCurrentList (list) {
  if (list !== currentList) {
    currentList = list;
    render();
  }
}


function sort () {
  let todoItems = [];
  let doneItems = [];
  for (let todo of currentList.items) {
    if (todo.tags.done) {
      doneItems.push(todo);
    } else {
      todoItems.push(todo);
    }
  }
  
  save(currentList, {items: todoItems.concat(doneItems)});
}


// Rendering


function render () {
  let listsDOM = node("div", {id: "todo-lists"});
  for (let list of todoLists) {
    listsDOM.appendChild(renderListTitle(list));
  }  
  
  let todosDOM = node("div", {id: "current-list"});
  for (let todo of currentList.items) {
    todosDOM.appendChild(renderTodo(todo));
  }
  
  document.getElementById("todo-lists").replaceWith(listsDOM);
  document.getElementById("current-list").replaceWith(todosDOM);
  document.getElementById("notes").value = currentList.notes;
}


function renderListTitle (list) {
  return node("input", {
    className: list === currentList ? "list-title selected" : "list-title",
    value: list.title,
    onfocus: (event) => setCurrentList(list),
    oninput: (event) => save(list, {title: event.target.value}, false), // Save, but don't re-render.
  });
}


function renderTodo (todo) {
  return node("div", {className: todo.tags.done ? "todo done" : "todo"}, [
    toggle(todo, "done"),
    node("input", {type: "text", className: "todo-text", value: todo.text,
      oninput: (event) => save(todo, {text: event.target.value}, false), // Save, but don't re-render.
      onkeydown: (event) => handleKeyDown(todo, event)
    }),
    node("div", {className: "delete-button", innerText: "", onclick: () => deleteTodo(todo)}),
    toggle(todo, "pinned"),
    toggle(todo, "health"),
    toggle(todo, "project"),
    toggle(todo, "life"),
    toggle(todo, "maintenance"),
    toggle(todo, "entertainment")
  ]);
}


// DOM utilities


function node (tagName, options, children = []) {
  let node = Object.assign(document.createElement(tagName), options);
  for (let child of children) {
    node.appendChild(child);
  }
  return node;
}


function toggle (todo, tag, checked = todo.tags[tag]) {
  return node("span", {className: `toggle-container ${tag}`}, [
    node("input", {
      type: "checkbox",
      className: `toggle ${tag}`,
      checked,
      onchange: () => save(todo.tags, {[tag]: !checked})
    }),
    node("span", {})
  ]);
}