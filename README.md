# self-statistics-system-v2: The Neural Second Brain

self statistics system is a self motivation system inspiried by gaming systems.
This is done by maintaining a status screen of the user, including proper updating (progression) channels.
It leverages the **Google Gemini API** to classify human effort and visualizes progress through a stable **Directed Acyclic Graph (DAG)**.

Project URL: https://self-statistics-system-v2.web.app


## Documentation: 
our documentation and context files are strictly separated by audience. 
* `docs/`: Human-readable guides:
    * docs/dev/ for internal architecture, setup, and workflow guidelines, 
    * docs/user/ for application manuals. 
* All machine-facing instructions, active task plans, and daily AI development logs are isolated within the hidden .ai/ directory. For an official history of versioned updates, please refer to the CHANGELOG.md at the project root.