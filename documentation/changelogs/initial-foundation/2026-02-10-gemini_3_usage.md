“Gemini #” will refer to the Gemini # API call. More info in docs. 

IRL Status Screen uses Gemini 3 in three main ways: 
Voice transcription: transcribe the user’s speech into a journal entry
Action extraction: Extracting the actions the user is performing out of a journal entry
Concept generalization: Generalizes the actions extracted into skills. Generalizes the skills extracted into characteristics. Generalizes the characteristics until a ‘root’ node is reached (most general characterization).
These form a streamlined pipeline of unique and powerful functionality. 

Voice transcription pipeline: 
Convert the user’s speech into an audio blob. 
Convert the blob into transcribed speech using Gemini 3. Fall back to Gemini 2 if fail / unavailable. Fallback to webm transcription if fail / unavailable. 

Action extraction pipeline AND Concept generalization pipeline: 
Take the journal entry text and extract the following: Actions, Skills, Characteristics. 
“Gravitate” toward key characteristics (displayed in status screen) and ‘root node’ “progression”
Note: These pipelines are merged because it is more efficient and functional: “prompt stuffing” (single API call) worked much better empirically in my app than “prompt chaining” (multiple API calls in sequence). 

Development usage: Google AI studio | Gemini 3 LLM 

More information can be found in the github under ./documentation/
