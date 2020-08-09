import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    formData.description = formData.description + ' [Created on ' + new Date() + ']';
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <h1>thecodeschool Notes App</h1>
      <table> 
            <tr> 
                <th>Note Name</th> 
                <th>Note Description</th> 
                <th>Upload photo</th>
                <th></th> 
            </tr> 
        </table>
        <table class = "gfg"> 
            <tr> 
                <td class = "geeks">
                  <input
                    onChange={e => setFormData({ ...formData, 'name': e.target.value})}
                    placeholder="Note name"
                    value={formData.name}
                  />
                </td> 
                <td>
                  <textarea
                    type="textarea"
                    onChange={e => setFormData({ ...formData, 'description': e.target.value})}
                    placeholder="Note description"
                    value={formData.description}
                    rows={10}
                    cols={50}
                  />
                </td> 
                <td>
                  <input
                    type="file"
                    onChange={onChange}
                  />
                </td> 
                <td>
                <button onClick={createNote}>Create Note</button>
                </td> 
            </tr> 
        </table>  

      <div style={{marginBottom: 30}}>
      {
        notes.map(note => (
          <div key={note.id || note.name}>
            <h2>{note.name}</h2>
            <div>{note.description}</div>
            {
              note.image && <img src={note.image} style={{width: 400}} />
            } <br/>
            <button onClick={() => deleteNote(note)}>Delete note</button>
          </div>
        ))
      }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);