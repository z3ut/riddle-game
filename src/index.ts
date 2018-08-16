import { fromEvent, merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

const riddle = {
  text: 'A cute mammal.',
  answer: { regexp: /(cat|kitten)/g, answer: 'It is a cat!' },
  questions: [
    { regexp: /(leg)/g, answer: 'It has four legs.' },
    { regexp: /(tail)/g, answer: 'It has fluffy tail.' },
  ]
};

const chatElement = document.querySelector('[data-chat]');
const questionTextareaElement = document.querySelector<HTMLTextAreaElement>('[data-question]');
const askQuestionButtonElement = document.querySelector('[data-ask-question]');

let userInputStreams: Observable<string>[] = [];
let questionSubscribtion: Subscription;

initialize();

function initialize() {
  initializeSpeechRecognitionInput();
  initializeChatInput();

  const questionAsked = merge(...userInputStreams);

  addAnswer(riddle.text);

  questionSubscribtion = questionAsked.subscribe(question => {
    addQuestion(question);
    createAnswer(question);
  });
}

function initializeSpeechRecognitionInput() {
  try {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
  
    const speechRecognized = fromEvent(recognition, 'result');
  
    const questionAskedByMic = speechRecognized.pipe(map((e: any) => {
      return e.results[e.resultIndex][0].transcript as string;
    }));
  
    recognition.start();
  
    userInputStreams.push(questionAskedByMic);
  } catch(e) {
    // browser does not support speech recognition api (not chrome 33+)
  }
}

function initializeChatInput() {
  const submitQuestion = fromEvent(askQuestionButtonElement, 'click');
  const questionAskedByChat = submitQuestion.pipe(map(() => {
    const question = questionTextareaElement.value;
    questionTextareaElement.value = '';
    return question;
  }));
  userInputStreams.push(questionAskedByChat);
}


function addQuestion(question: string) {
  createChatText(question, 'question');
}

function addAnswer(answer: string) {
  synthesisPhrase(answer);
  createChatText(answer, 'answer');
}

function synthesisPhrase(text: string) {
  try {
    const msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
  } catch (e) { }
}

function createChatText(text: string, cssClass: string) {
  const chatTextElement = document.createElement('div');
  chatTextElement.classList.add(cssClass);
  chatTextElement.textContent = text;
  chatElement.appendChild(chatTextElement);
  chatElement.scrollTop = chatElement.scrollHeight;
}

function createAnswer(question: string) {
  const lowercaseQuestion = question.toLowerCase();
  if (riddle.answer.regexp.test(lowercaseQuestion)) {
    addAnswer(riddle.answer.answer);
    questionSubscribtion.unsubscribe();
    return;
  }
  for (let q of riddle.questions) {
    if (q.regexp.test(lowercaseQuestion)) {
      addAnswer(q.answer);
      return;
    }
  }
  addAnswer('I don\'t know.');
}
