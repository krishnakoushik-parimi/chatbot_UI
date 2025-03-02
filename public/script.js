// Global variables and state
let chatBox = document.getElementById("chat-box");
let userInput = document.getElementById("user-input");
let sendButton = document.getElementById("send-button");
let chatList = document.getElementById("chat-list");
let chatState = {
    step: 0,
    userResponses: {},
    userName: "",
    abuserName: "",
    chatId: ""
};
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// Initialize chat history and dark mode on page load
window.onload = function () {
    loadDarkModePreference();
    loadChatHistory();
    startChat();
};

// Function to generate a unique chat ID with Name + Timestamp
function generateChatId(userName) {
    let validName = userName && userName.trim() !== "" ? userName : "Anonymous";
    let timestamp = new Date().toLocaleString();
    return `${validName} - ${timestamp}`;
}

// Function to start a new chat
function startChat() {
    saveCurrentChat();
    chatBox.innerHTML = "";
    sendBotMessage("Hi, I am StaG. I can support you in documenting your experience for a 'Domestic Violence Protection Order'.");
    sendBotMessage("To start, could you please tell me your name?");
    chatState.step = 1; // Set step to 1 to indicate waiting for user name
}

// Function to save the current chat to history
function saveCurrentChat() {
    if (chatState.userResponses && Object.keys(chatState.userResponses).length > 0) {
        let existingChatIndex = chatHistory.findIndex(chat => chat.chatId === chatState.chatId);
        if (existingChatIndex !== -1) {
            chatHistory[existingChatIndex] = { ...chatState, messages: chatBox.innerHTML };
        } else {
            chatHistory.push({ ...chatState, messages: chatBox.innerHTML });
        }
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        updateChatHistoryUI();
    }
}

// Function to add chat to sidebar
function addChatToSidebar(chat) {
    let chatItem = document.createElement("li");
    chatItem.textContent = chat.chatId;
    chatItem.dataset.chatId = chat.chatId;
    chatItem.addEventListener("click", () => restoreChat(chat.chatId));
    chatList.appendChild(chatItem);
}

// Function to restore a specific chat
function restoreChat(chatId) {
    let chat = chatHistory.find(c => c.chatId === chatId);
    if (chat) {
        chatState = { ...chat };
        chatBox.innerHTML = chat.messages;
    }
}

// Function to update the sidebar chat history UI
function updateChatHistoryUI() {
    chatList.innerHTML = "";
    chatHistory.forEach(chat => addChatToSidebar(chat));
}

// Function to send bot message
function sendBotMessage(message) {
    let botMessage = createMessageElement("bot", message);
    chatBox.appendChild(botMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to send bot message with options
function sendBotMessageWithOptions(question, options) {
    let botMessage = createMessageElement("bot", question);
    chatBox.appendChild(botMessage);
    let optionsDiv = document.createElement("div");
    optionsDiv.classList.add("options");
    options.forEach(option => {
        let radioWrapper = document.createElement("div");
        let radio = document.createElement("input");
        radio.type = "radio";
        radio.name = question;
        radio.value = option;
        radio.id = option;
        let label = document.createElement("label");
        label.setAttribute("for", option);
        label.textContent = option;
        radioWrapper.appendChild(radio);
        radioWrapper.appendChild(label);
        optionsDiv.appendChild(radioWrapper);
        radio.addEventListener("change", () => handleResponse(option, question));
    });
    chatBox.appendChild(optionsDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleResponse(answer, question) {
    const chatBox = document.getElementById("chat-box");
    let userMessage = createMessageElement("user", answer);
    chatBox.appendChild(userMessage);
    // Save the user response
    chatState.userResponses[chatState.step] = answer;
    // Disable radio buttons for the current question
    disableOptions(question);
    // Handle different chat steps
    if (chatState.step === 1) {
        // Get user's name
        chatState.userName = answer;
        chatState.chatId = generateChatId(chatState.userName);
        sendBotMessage(`Ok, ${chatState.userName}, you can take this at your own pace. If at any point you need a break, let me know.`);
        sendBotMessage("What is the abuser's name? You can use a nickname or initials if that feels safer for you.");
        chatState.step = 2;
        //nextStep();
    } else if (chatState.step === 2) {
        chatState.abuserName = answer;
        sendBotMessage("What is your relationship with the abuser? For example, are they your spouse, partner, ex-spouse, family member, or someone else?");
        chatState.step = 3;
        //nextStep();
    } else if (chatState.step === 3) {
        chatState.relationship = answer;
        sendBotMessageWithOptions("Which incident are you reporting?", ["Recent", "Past"]);
        chatState.step = 4;
    } else if (chatState.step === 4) {
        if (answer === "Recent" || answer === "Past") {
            chatState.incidentType = answer;
            if (chatState.incidentType === "Recent") {
                sendBotMessage("Describe the most recent violent act, fear, or threat of violence, and why the temporary order should be entered today without notice to the respondent. Please provide specific details, including the approximate dates and police responses.");
            } else if (chatState.incidentType === "Past") {
                sendBotMessage("Describe the past incidents where you experienced violence, were afraid of injury, or where the respondent threatened to harm or kill you. Please include specific acts, approximate dates, and any police responses.");
            }
            chatState.step = 5;
        } else {
            sendBotMessage("Please select from the given options: Recent or Past.");
            return; // Don't proceed further
        }
        //nextStep();
    } else if (chatState.step === 5) {
        chatState.step = 6;
        sendBotMessage("How has this affected you? This helps ensure your statement fully reflects your experience.");
        sendBotMessage("Please describe the impact.");
        //nextStep();
    } else if (chatState.step === 6) {
        sendBotMessage("Thank you for sharing your responses.");
        chatState.step = 7;
    } else {
        chatState.step++; // Normal progression
        // Proceed to the next step
        setTimeout(() => {
            nextStep();
        }, 500);
    }
}

// Function to handle the next step in conversation
function nextStep() {
    switch (chatState.step) {
        case 3:
            sendBotMessage("What is your relationship with the abuser? For example, are they your spouse, partner, ex-spouse, family member, or someone else?");
            break;
        case 4:
            sendBotMessageWithOptions("Which incident are you reporting?", ["Recent", "Past"]);
            break;
        case 5:
            if (chatState.incidentType === "Recent") {
                sendBotMessage("Describe the most recent violent act, fear, or threat of violence, and why the temporary order should be entered today without notice to the respondent. Please provide specific details, including the approximate dates and police responses.");
            } else if (chatState.incidentType === "Past") {
                sendBotMessage("Describe the past incidents where you experienced violence, were afraid of injury, or where the respondent threatened to harm or kill you. Please include specific acts, approximate dates, and any police responses.");
            }
            break;
        case 6:
            sendBotMessage("How has this affected you? This helps ensure your statement fully reflects your experience.");
            sendBotMessage("Please describe the impact.");
            break;
        default:
            sendBotMessage("Thank you for sharing your responses.");
            break;
    }
}

// Ensure the chat flow follows the correct sequence
function ensureGreeting() {
    if (chatState.step === 0) {
        startChat(); // Send greeting first
    }
}

// Handle the response for name and other text inputs
userInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    let userMessage = userInput.value.trim();
                    if (userMessage !== "") {
                        handleResponse(userMessage);
                        userInput.value = ""; // Clear input field
                    }
                }
            });

// Button click event for sending messages
document.getElementById("send-button").addEventListener("click", function () {
                let message = userInput.value.trim();
                if (message !== "") {
                    handleResponse(message);
                    userInput.value = ""; // Clear input field
                }
            });

// Disable radio options after selection
function disableOptions(question) {
    let optionsDivs = document.querySelectorAll(".options");
    optionsDivs.forEach(optionsDiv => {
                    let radios = optionsDiv.querySelectorAll(`input[name='${question}']`);
                    radios.forEach(radio => {
                            if (!radio.checked) {
                                radio.disabled = true; // Disable only unselected options
                            }
                        });
                });
}

// Function to create message elements for user and bot
function createMessageElement(sender, text) {
    let messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    let profilePic = document.createElement("img");
    profilePic.className = "profile-pic";
    profilePic.src = sender === "user" ? "user.png" : "bot-2.png";
    profilePic.alt = sender === "user" ? "User Profile" : "Bot Profile";
    let messageText = document.createElement("div");
    messageText.className = "text";
    messageText.textContent = text;
    messageDiv.appendChild(profilePic);
    messageDiv.appendChild(messageText);
    return messageDiv;
}

// Load chat history in sidebar
function loadChatHistory() {
    chatHistory.forEach(chat => addChatToSidebar(chat));
}

// Clear all chats
function clearAllChats() {
    localStorage.removeItem("chatHistory");
    chatHistory = [];
    chatList.innerHTML = "";
    chatBox.innerHTML = "";
    startChat();
    updateChatHistoryUI();
}

// Trigger the greeting when the page loads
window.onload = function () {
    loadDarkModePreference();
    loadChatHistory();
    ensureGreeting(); // Call ensureGreeting to start the chat flow
};

// Function to toggle the chat history sidebar visibility
function toggleChatHistory() {
    let body = document.body;
    let chatContainer = document.querySelector(".chat-container"); // This is the main content container
    let sidebar = document.getElementById("chat-history-sidebar");
    // Toggle the 'sidebar-open' class on the body for global styling (can control dimming effect etc.)
    body.classList.toggle("sidebar-open");
    // Toggle the 'open' class on the sidebar to control visibility
    sidebar.classList.toggle("open");
    // Toggle the 'sidebar-expanded' class on the chat-container to adjust the content width when sidebar is expanded
    chatContainer.classList.toggle("sidebar-expanded");
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    document.getElementById("dark-mode-btn").textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
}

// Load dark mode preference from localStorage
function loadDarkModePreference() {
    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        document.getElementById("dark-mode-btn").textContent = "☀️";
    } else {
        document.getElementById("dark-mode-btn").textContent = "🌙";
    }
}