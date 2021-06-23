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

