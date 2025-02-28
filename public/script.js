// Global variables and state
let chatBox = document.getElementById("chat-box");
let userInput = document.getElementById("user-input");
let sendButton = document.getElementById("send-button");
let chatList = document.getElementById("chat-list");

let chatState = {
    step: 0,
    userResponses: {},
    chatId: generateChatId()
};

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// Initialize chat history and dark mode on page load
window.onload = function () {
    loadDarkModePreference();
    loadChatHistory();
    startChat();
};

// Function to generate unique chat ID
function generateChatId() {
    return "chat-" + new Date().getTime();
}

// Function to start a new chat
function startChat() {
    saveCurrentChat();
    chatState = {
        step: 0,
        userResponses: {},
        chatId: generateChatId()
    };
    chatBox.innerHTML = "";
    sendBotMessage("Hello, I am {NAME}! I am here to support you in documenting your experience for a 'Domestic Violence Protection Order'.");
    sendBotMessage("You can take this at your own pace. If at any point you need a break or have any concerns, you can let me know!");
    sendBotMessageWithOptions("Are you ready to begin?", ["Yes", "No"]);
    updateChatHistoryUI();
}


// Save the current chat to history
function saveCurrentChat() {
    if (chatState.userResponses && Object.keys(chatState.userResponses).length > 0) {
        let existingChatIndex = chatHistory.findIndex(chat => chat.chatId === chatState.chatId);
        if (existingChatIndex !== -1) {
            chatHistory[existingChatIndex] = { ...chatState, messages: chatBox.innerHTML };
        } else {
            chatHistory.push({ ...chatState, messages: chatBox.innerHTML });
        }
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    }
}



function addChatToSidebar(chat) {
    let chatItem = document.createElement("li");

    // Ensure chat.chatId is defined and valid before splitting
    if (chat.chatId && chat.chatId.split) {
        chatItem.textContent = `Chat ${chat.chatId.split("-")[1]}`;
    } else {
        chatItem.textContent = "Chat [Unknown]";
    }

    chatItem.dataset.chatId = chat.chatId;
    chatItem.addEventListener("click", () => restoreChat(chat.chatId));
    chatList.appendChild(chatItem);
}


// Restore a specific chat
function restoreChat(chatId) {
    let chat = chatHistory.find(c => c.chatId === chatId);
    if (chat) {
        chatState = { ...chat };
        chatBox.innerHTML = chat.messages;
    }
}

// Update the sidebar chat history UI
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

    // If answering "Which incident are you reporting?" (Step 3)
    if (chatState.step === 3) {
        chatState.incidentType = answer; // Store the selected incident type (Most Recent/Past)

        // Dynamically generate the follow-up question based on selection
        if (chatState.incidentType === "Most Recent") {
            sendBotMessage("Describe the most recent violent act, fear, or threat of violence, and why the temporary order should be entered today without notice to the respondent. Please provide specific details, including the approximate dates and police responses.");
        } else if (chatState.incidentType === "Past Incidents") {
            sendBotMessage("Describe the past incidents where you experienced violence, were afraid of injury, or where the respondent threatened to harm or kill you. Please include specific acts, approximate dates, and any police responses.");
        }

        // Move to a new sub-step (Step 4), but do NOT proceed to the next step automatically
        chatState.step = 4;
        return;
    }

    // If user has just described the incident (Step 4), proceed to Step 5
    if (chatState.step === 4) {
        chatState.step = 5;
    } else {
        chatState.step++; // Normal progression
    }

    // Proceed to the next step
    setTimeout(() => {
        nextStep();
    }, 500);
}

function nextStep() {
    switch (chatState.step) {
        case 1:
            sendBotMessage("Let’s start with some basic details. You can skip anything you’re not comfortable sharing.");
            sendBotMessage("What is your name?");
            break;
        case 2:
            sendBotMessage("What is your relationship with the abuser?");
            break;
        case 3:
            sendBotMessageWithOptions("Which incident are you reporting?", ["Most Recent", "Past Incidents"]);
            break;
        case 4:
            // This is where the dynamic incident description question will be shown
            break;
        case 5:
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
        startChat();  // Send greeting first
    }
}

// Call ensureGreeting on page load
window.onload = function () {
    ensureGreeting();  // Make sure greeting is shown first
};

// Handle the response for name and other text inputs
userInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        let userMessage = userInput.value.trim();
        if (userMessage !== "") {
            handleResponse(userMessage);
            userInput.value = "";  // Clear input field
        }
    }
});

// Button click event for sending messages
document.getElementById("send-button").addEventListener("click", function () {
    let message = userInput.value.trim();
    if (message !== "") {
        handleResponse(message);
        userInput.value = "";  // Clear input field
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
    profilePic.src = sender === "user" ? "user.png" : "bot.png";
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
}
// Trigger the greeting when the page loads
window.onload = function () {
    startGreeting();
};

// Function to send greeting message
function startGreeting() {
    sendBotMessage("Hello, I am {NAME}!");
    sendBotMessage("I am here to support you in documenting your experience for a 'Domestic Violence Protection Order'.");
    sendBotMessage("You can take this at your own pace, If at any point you need a break or have any concerns, you can let me know!");
    sendBotMessageWithOptions("Are you ready to begin?", ["Yes", "No"]);
}

// Handle the name input and move to the next step
userInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        let userMessage = userInput.value.trim();
        if (userMessage !== "") {
            handleResponse(userMessage);
            userInput.value = ""; // Clear the input field
        }
    }
});

// Prevent default Enter behavior and send message
document.getElementById("send-button").addEventListener("click", function () {
    let message = userInput.value.trim();
    if (message !== "") {
        handleResponse(message);
        userInput.value = ""; // Clear the input field
    }
});


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