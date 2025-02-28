// Global variables and state
let chatBox = document.getElementById("chat-box");
let userInput = document.getElementById("user-input");

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

// Start a new chat session
function startChat() {
    chatState.step = 0;
    chatState.userResponses = {};
    chatBox.innerHTML = "";
    sendBotMessage("Hello, I am {NAME}! I am here to support you in documenting your experience for a 'Domestic Violence Protection Order'");
    sendBotMessageWithOptions("Are you ready to begin?", ["Yes", "No"]);
}

// Function to send a message from the bot
function sendBotMessage(message) {
    let botMessage = createMessageElement("bot", message);
    chatBox.appendChild(botMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to display a message with options (radio buttons)
function sendBotMessageWithOptions(question, options) {
    let botMessage = createMessageElement("bot", question);
    chatBox.appendChild(botMessage);

    // Create radio button options
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
            handleResponse(option);
        });
    });

    chatBox.appendChild(optionsDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle user response and update step
function handleResponse(answer) {
    let userMessage = createMessageElement("user", answer);
    chatBox.appendChild(userMessage);

    // Save the user response based on the current step
    chatState.userResponses[chatState.step] = answer;

    // Lock the options and prevent further changes
    disableOptions();

    // Update the chatState to proceed to the next step
    chatState.step++;

    // Proceed to the next step after a slight delay
    setTimeout(() => {
        nextStep();
    }, 500);
}

// Disable radio options after selection
function disableOptions() {
    let optionsDiv = document.querySelector(".options");
    let radios = optionsDiv.querySelectorAll("input[type='radio']");
    radios.forEach(radio => {
        radio.disabled = true; // Disable all radio buttons after response
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

// Handle the next step in the conversation based on the chat state
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
            sendBotMessage("Which incident are you reporting? (Recent/Past)");
            sendBotMessageWithOptions("Which incident?", ["Recent", "Past"]);
            break;
        case 4:
            sendBotMessage("Let’s go over what happened recently. You can share as much or as little as you feel comfortable with.");
            sendBotMessage("Please describe the recent incident.");
            break;
        case 5:
            sendBotMessage("Now, let’s talk about any past incidents that have led to this situation.");
            sendBotMessage("Please describe the past incidents.");
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

// Function to save the chat session to localStorage
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

// Prevent default Enter behavior and send message
document.getElementById("user-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Send the user's message
function sendMessage() {
    let message = userInput.value.trim();
    if (message !== "") {
        let userMessage = createMessageElement("user", message);
        chatBox.appendChild(userMessage);
        saveChatSession();
        userInput.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
