# Tourguider App Design prospects
We want to design a web based design that is mobile friendly. The thing we are building is a Tourism industry targeted application. Now the main feature of this app is using AI assistant to get many things done. These things , some of them could be done via the UI , but others needs a more complicated flow in the backed and we kinda abstract that complexity away by using the AI Chat and doing it this way. Here are the things:
- The AI Chat should be very robust and plugged into the rest of the website and the user should be able to feel that the operational capability of the AI is available to them always.
- There should be a very nice timeline, we are planning on having the timeline nodes.
- The Chat + Timeline + previewing special travel related items bringing all this to users interface without cluttering things is the main challenge, they should be available not all at once but the user should be able to interact with the timeline and when user clicks on a particular node the relevant travel related items should show up in the UI. That is the App display should switch from `Timeline View` to `Timeline Item View`.
 
 
## Main Views
At all times the AI Chat is visible in the bottom. The AI Chat kind of replaces the nav bar because according to our chat messages whats displayed on the screen will change. Of course include in a button that would pull up a manual navbar if necessary for user to navigate. But the main idea is "Let the AI now what you want to accomplish in the app today".
1. Trips View
2. Timeline View
3. Timeline Item View
4. Timeline Modifier mode View
5. Map View
6. Emergency View
 

Note that the AI Agent should be able to switch between views at anytime according to the chat with the user. (eg: show me the mountain in map = AI jumps to Map View and shows it, lets look at the other trip = AI jumps to Trips View and navigates to other Timeline View page, Theres an emergency ! = AI jumps to Emergency View)

### Trips View
This is the landing page of the app, initially empty with something like a `+` button or `plan` button, something appropriate to signal the user "Lets get started on your trip". Now if the user adds a trip and there is only one trip, then the landing page becomes the `Timeline View` of that trip. If the user has more that one trips planned then the landing page again becomes the `Trips View`, this time the user can pick one of the trips to continue with.
 
### Timeline View
This page is one where all of the planned timeline nodes of the particular trip is displayed. It is mainly a scrollable view with a vertically arranged set of nodes, each node is joined by a straight line that goes all the way down. Initially this page is empty but will be populated as the user chats with the AI. [ point to discuss should the user be able to manually populate this? Can be very complicated UX]. Each timeline node should contain only the bare minimum of details visible here. Small notes can be placed right next to nodes for best UI UX, allowing the user to at a glance see something like a reminder.

### Timeline Modifier mode View
This page is where things gets quite complicated if the user trys to manually do everything. Lets keep this to a purely AI agent operated page. It allows the user to see some of the most awesome featuers of the entire app. 

Firstly in plan mode when chating with AI it should ask questions, so a small question popup should be integrated. It is kinda like the claude ai question asking place. When the user is chatting with the AI and plannig , and anygiven time the AI could ask the user for addional clarifications. The question popup should be capable of showing multiple pickable options, the options themselves are set by the AI, once a user picks an option it should go back to the backedn as a user chat response. Now the Question Pop should be scrollable and support displaying both text and images in the question options. Like an online MCQ quesion paper but with interactive images. The images themselves should showup resized in small size but when the user taps on the image it should maximize so that the user can see it properly. The content of the question prompt is entirely controlled by the AI, its like a really advance tool that the AI agent can utilize.

Secondly in plan mode there could be the situation where the backend decision was made to navigate to this page because there is something like a distruptive circumstance going. It can be something simpler like bad weather or something dangerous like an actual natural disaster occurance. the backed along with AI should identify such a distruption if the user talks about it or, if the backend is notified about it via things like news alerts. In this particular special instance, the nodes of the timeline that would be affected by this distruption should be highlighted in red. Like if its bad weather today then the todays node should be displayed in red and tommorrows and day after tommorrows nodes can be normal colored , the extent of how many nodes are covered in red will be decided by the AI backend. In this mode the AI should work with the user as much possible to plan workarounds, do reschedulings those types of things. (kinda like handling a merge conflict in GitHub, not everythings red but somethings are, and to continue onwards the conflicts/ distruptions need to be resolved). Of course if the user doesnt want to rework this node they can just have the AI remove that node.

Thirdly in plan mode the AI can trigger question popups that are more than just the question answer type discussed above. The AI can prompt the user to pick a hotel to stay in, a restaurant to eat in, etc according to how the conversation with the user is going. This could mean a slightly different question popup component or a robust singular question popup component capable of getting user input for both questions and answers MCQ style + getting user feedback with "Heres a catalogue of all the restaurants available in this region, would like to pick one? If these are too expensive mention your buget and show you updated options". So its like a Catalog popup. It seems to  be good to keep these things separate. A catalog popup and a questions popup.

The Timeline Modifier is kinda like the heart of the app, it needs to be designed well. User might spend most of their time on this page anyways. (As mentioned in this document, these features are quite complex and having the user manually do these things by clicking buttons can get extremely complicated)


### Map View
This is a page where the user can we locations, their current location and where they are going etc. The Agent can use the page to quickly show a preview of a trip route or anyother location based illustration. The agent should be able to switch between this page from any other page as necessary.

### Emergency View
This page contains all the emergency the details such as quick dial to emergency services, or contact the company .. these types of things. (An emergency ! button should be appropriately placed in timeline item view + Map view aswell)
 
## navigation between views/pages
- When user chats with the AI, the backed identifies the intent of the user and sends an event so that the view displayed in the App gets changed accordingly.
(example: planning / modification intent the UI changes into Timeline Modifier mode View)
 
## Special Travel related items
The following items :
- Hotel Boookings
- Restaurants
- Leisure activities
- Transportation modes
- Medical Facilities