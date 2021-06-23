import './index.html';
import './scss/style.scss';
import firebase from 'firebase/app';
import 'firebase/firestore';
import config from './db_config.js';
import scrolIntoView from 'scroll-into-view-if-needed';
import { data } from 'autoprefixer';


const firedb = firebase.initializeApp(config);
const db = firedb.firestore();

async function sendMessage(data) {
  const res = await db.collection('messages').add(data);
  document.querySelector('#message').value = '';
  console.log(res);
}

// a display message az id paraméterrel is dolgozik
function displayMessage(message, id) {
  const messageDOM = `
      <div class="message" data-id="${id}">
        <i class="fas fa-user"></i>
        <div>
          <span class="username">${message.username}
          <time> ${message.date.toDate().toLocaleString("hu")}
          </time>
          </span>
          <br>
          <span class="message-text">
            ${message.message}
          </span>
        </div>
        <div class="message-edit-buttons">
          <i class="fas fa-trash-alt"></i>
          <i class="fas fa-pen"></i>
        </div>
      </div>
  `;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageDOM);
  // az id-ra hivatkozva kiválasztjuk a 'kuka' HTML elemet és eventListenert teszünk rá, ami meghívja a remove és deleteMessage függvényeket az id paraméterrel
  document.querySelector(`[data-id="${id}"] .fa-trash-alt`).addEventListener('click', () => {
    removeMessage(id);
    deleteMessage(id);
  });
  // az id-ra hivatkozva kiválasztjuk a 'ceruza' HTML elemet és eventListenert teszünk rá, ami meghívja a displayEditMessage függvényt az id paraméterrel
  document.querySelector(`[data-id="${id}"] .fa-pen`).addEventListener('click', () => {
    displayEditMessage(id);
  });

  scrolIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });


}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = firebase.firestore.Timestamp.fromDate(new Date());
  // ha a változó neve ugyanaz mint a key amit létre akarunk hozni
  // az objectben akkor nem kell kétszer kiírni...
  return { message, username, date };
}


async function displayAllMessages() {
  const query = await db.collection('messages').orderBy('date', 'asc').get();
  query.forEach((doc) => {
    // displayMessage(doc.data());
  });
}

function handleMessage() {
  const message = createMessage();
  if (message.username && message.message) {
    sendMessage(message);
    // displayMessage(message);
  }
}

// amikor a html teljesen betölt: 
window.addEventListener('DOMContentLoaded', () => {
  displayAllMessages();
  document.querySelector('#send').addEventListener('click', () => {
    handleMessage();
  });
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleMessage();
  }
});

// a az id-ra hivatkozva kiválasztja az adott üzenetet és törli a UI-ból
function removeMessage(id) {
  document.querySelector(`[data-id="${id}"]`).remove();
};

// a az id-ra hivatkozva kiválasztja az adott üzenetet és törli az adatbázisból
function deleteMessage(id) {
  db.collection('messages').doc(id).delete();
};

// csinál egy popup ablakot, amiben vagy egy close gomb felül, egy text mező középen és egy save gomb alul
function displayEditMessage(id) {
  const markup = /*html*/`
  <div class="popup-container" id="popup">
    <div class="edit-message" id="edit-message" data-id="${id}">
      <div id="close-popup" class="button">
        Close <i class="fa fa-window-close" aria-hidden="true"></i>
      </div>
      <textarea id="edit" name="" cols="30" rows="10">
      ${document.querySelector(`.message[data-id="${id}"] .message-text`).textContent.trim()
    }</textarea>
      <div id="save-message" class="button">
        Save message<i class="fas fa-save"></i>
      </div>
    </div>
  </div>
`;
  // beilleszti az egész popup ablakot
  document.querySelector('#messages').insertAdjacentHTML('beforeend', markup);
  // a close gomb kattintásra meghívjuk a closePopup függvényt
  document.getElementById("close-popup").addEventListener('click', () => closePopup());
  // definiáluk a textarea változban eltároljuk a szövegdobozt
  let textarea = document.getElementById("edit");
  // a save gombra kattintásra meghívjuk a saveMessage és closePopup függvényeket
  document.getElementById("save-message").addEventListener('click', () => {
    saveMessage(id, textarea.value);
    closePopup();
  });
};

// a függvény bezárja az edit ablakot
function closePopup() {
  document.getElementById("popup").remove();
};

// módosítjuk az adatbázisban az adott id-re vonatkoző documentum tartalmának message elemét
async function saveMessage(id, text) {
  db.collection("messages").doc(id).update({
    message: text
  });
  // módosítjuk az adott üzenetet a UI-ban is
  document.querySelector(`[data-id="${id}"] .message-text`).textContent = text;
};


// listen for changes in the database
db.collection('messages').orderBy('date', 'asc')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // kiegészítjük a lekért adatokat az id-val a .id segítségével
        displayMessage(change.doc.data(), change.doc.id);
      }
      if (change.type === 'modified') {
        console.log('Modified message: ', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed message: ', change.doc.data());
      }
    });
  });

