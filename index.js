/* PERSISTENCE */

let notes;
const ls = window.localStorage;
function saveNotes() {
  ls.setItem('notes', JSON.stringify(notes));
}

function initStorage() {
  let date = new Date;
  const now = date.setMinutes(date.getMinutes() - 1);

  date = new Date;
  const tomorrow = date.setHours(date.getHours() + 18);

  const tips = [
    { text: 'Get periodic reminders for notes you write. Like more orderly post-its.',
      reviewAfter: now,
      interval: 2880
    },
    { text: 'Choose between `Next` to keep the note in rotation, or `Reject` when you no longer need it.',
      reviewAfter: now,
      interval: 2880
    },
    { text: 'You can choose when you want to first be reminded of a note when you create it using the drop down next to `Submit`.', reviewAfter: tomorrow, interval: 2880
    }
  ];

  ls.setItem('notes', JSON.stringify(tips));
}

// TODO: return promises
function fetchNotes() {
  if (ls.getItem('notes') === null)
    initStorage();

  notes = JSON.parse(ls.getItem('notes'));
  notes.forEach(note => note.reviewAfter = new Date(note.reviewAfter));

  return notes;
}

function postNote(note) {
  note.reviewAfter = nextReviewAfter(note).reviewAfter;

  notes.push(note);
  saveNotes();
}

function patchNote(note, changes) {
  for (let key in changes)
    note[key] = changes[key];
  saveNotes();
}

function deleteNote(note) {
  notes.splice(notes.indexOf(note), 1);
  saveNotes();
}

/* MODELS */

function nextReviewAfter(note) {
  const date = new Date;
  date.setTime(date.getTime() + note.interval * 60000);

  return {
    reviewAfter: date,
    interval: note.interval * 2
  };
}

function nextNote(notes) {
  return notes.filter(isDue).sort(compareNotes)[0];
}
// private methods and data for nextNote
function isDue(note) {
  return note.reviewAfter < new Date
}
function compareNotes(note1, note2) {
  return note1.reviewAfter - note2.reviewAfter
}

/* COMPONENTS */

class NoteInput extends React.Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
  }

  save(event) {
    event.preventDefault();
    postNote({ text: this.textInput.value, interval: this.select.value });
    this.textInput.value = '';
  }

  render() {
    return (
      <form onSubmit={this.save}>
        <textarea ref={c => this.textInput = c}></textarea>
        <label>
          Review after
          <select ref={c => this.select = c}>
            <option value="10"> 10 minutes </option>
            <option value="60"> 1 hour </option>
            <option value="240"> 4 hours </option>
            <option value="1440" selected> 1 day </option>
            <option value="2880"> 2 days </option>
            <option value="10080"> 1 week </option>
          </select>
        </label>
        <input type="submit" />
      </form>
    );
  }
}

function ReviewNote({ note, onNext, onReject }) {
  return (
    <div>
      <p> {note.text} </p>
      <div>
        <button onClick={onNext}> Next </button>
        <button onClick={onReject}> Reject </button>
      </div>
    </div>
  );
}

class Review extends React.Component {
  constructor(props) {
    super(props);
    // TODO: act as if actually fetching from server
    this.notes = fetchNotes();
    this.state = { note: nextNote(this.notes) };
  }

  updateNote(note) {
    patchNote(note, nextReviewAfter(note));
    this.setState({ note: nextNote(this.notes) });
  }

  deleteNote(note) {
    deleteNote(note);
    this.setState({ note: nextNote(this.notes) });
  }

  render() {
    const note = this.state.note;
    if (note != null)
      return (
        <ReviewNote
          note={note}
          onNext={() => this.updateNote(note)}
          onReject={() => this.deleteNote(note)} />
      );
    else
      return <p> Nothing to review! </p>;
    end
  }
}

function App() {
  return (
    <div>
      <NoteInput />
      <Review />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('app'));
