import {useState} from 'react';
import './CopyLessonLink.css';
export default function CopyLessonLink(){
 const [status,setStatus]=useState('');
 async function copy(){try{await navigator.clipboard.writeText(location.href);setStatus('Skopiowano link');}catch{setStatus('Skopiuj adres z paska przeglądarki');}}
 return <div className="lesson-link-action"><button type="button" onClick={copy} title="Skopiuj link do wybranej lekcji i zadania"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l4-4m12 0 2-2a4 4 0 0 1 6 6l-4 4" transform="translate(1 0) scale(.92)"/></svg>Kopiuj link do zadania</button>{status&&<span role="status">{status}</span>}</div>;
}
