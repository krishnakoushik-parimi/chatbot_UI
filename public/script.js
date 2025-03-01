// Global variables and state
let chatBox = document.getElementById("chat-box");
let userInput = document.getElementById("user-input");
let sendButton = document.getElementById("send-button");

let chatState = {
    step: 0,
    userResponses: {}
};

// Initialize chat history and dark mode on page load
window.onload = function () {
    loadDarkModePreference();
    loadChatHistory();
    startChat();
};

// Function to start the chat and send the greeting
function startChat() {
    chatState.step = 0;
    chatState.userResponses = {};
    chatBox.innerHTML = "";

    // Send the initial greeting
    sendBotMessage("Hello, I am {NAME}! I am here to support you in documenting your experience for a 'Domestic Violence Protection Order'.");
    sendBotMessage("You can take this at your own pace. If at any point you need a break or have any concerns, you can let me know!");
    sendBotMessageWithOptions("Are you ready to begin?", ["Yes", "No"]);
}

// Function to send a message from the bot
function sendBotMessage(message) {
    let botMessage = createMessageElement("bot", message);
    chatBox.appendChild(botMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}


// Function to send a message with options (radio buttons)
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

        // Attach event listener for when user selects an option
        radio.addEventListener("change", () => {
            handleResponse(option, question);
        });
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
        chatState.incidentType = answer; // Store the selected incident type (Recent/Past)

        // Dynamically generate the follow-up question based on selection
        sendBotMessage(`Now, let’s talk about any ${answer} incidents that have led to this situation.`);
        sendBotMessage(`Please describe the ${answer} incident.`);

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
            sendBotMessageWithOptions("Which incident are you reporting?", ["Recent", "Past"]);
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

// Save chat history to localStorage
function saveChatSession() {
    let currentChat = JSON.parse(localStorage.getItem("currentChat")) || [];
    currentChat.push({ sender: "user", message: userInput.value });
    localStorage.setItem("currentChat", JSON.stringify(currentChat));
}

// Load chat history and display
function loadChatHistory() {
    let chatSessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
    chatSessions.forEach(chat => {
        let li = document.createElement("li");
        li.innerText = new Date(chat.id).toLocaleString();
        li.onclick = () => loadChat(chat.id);

        let deleteBtn = document.createElement("button");
        deleteBtn.innerText = "❌";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };

        li.appendChild(deleteBtn);
        document.getElementById("chat-list").appendChild(li);
    });
}

// Load a specific chat from storage
function loadChat(chatId) {
    let chatSessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
    let chat = chatSessions.find(c => c.id === chatId);
    if (chat) {
        chatBox.innerHTML = "";
        chat.messages.forEach(msg => {
            let messageElem = createMessageElement(msg.sender, msg.message);
            chatBox.appendChild(messageElem);
        });
    }
}

// Delete a specific chat session
function deleteChat(chatId) {
    let chatSessions = JSON.parse(localStorage.getItem("chatSessions")) || [];
    chatSessions = chatSessions.filter(chat => chat.id !== chatId);
    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
    loadChatHistory();
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