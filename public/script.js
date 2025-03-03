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
    incidentType: null,
    chatId: ""
};
let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// Initialize chat history and dark mode on page load
window.onload = function () {
    loadDarkModePreference();
    loadChatHistory();
    ensureGreeting();
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
    chatState.step = 1;
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

// Function to send bot message with typing animation
function sendBotMessage(message) {
    let typingIndicator = showTypingIndicator();
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        chatBox.removeChild(typingIndicator); // Remove typing animation

        let botMessage = createMessageElement("bot", message);
        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1500); // Adjust delay as needed
}

function showTypingIndicator() {
    let typingIndicator = document.createElement("div");
    typingIndicator.className = "message bot-message typing-indicator";

    let profilePic = document.createElement("img");
    profilePic.className = "profile-pic loading";
    profilePic.src = "bot-2.png"; // Bot's profile pic
    profilePic.alt = "Bot Profile";

    let dots = document.createElement("span");
    dots.className = "typing-dots";
    dots.innerHTML = `<span>.</span><span>.</span><span>.</span>`; // Typing animation

    typingIndicator.appendChild(profilePic);
    typingIndicator.appendChild(dots);
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    return typingIndicator; // Return this so it can be removed later
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

async function sendToFlask(incidentType, prompt) {
    const flaskEndpoint = 'http://149.165.175.242:5000/process_statement';

    // Show the typing animation
    let typingIndicator = showTypingIndicator();

    try {
        const requestBody = {
            "question_type": incidentType,
            "prompt": prompt
        };

        const response = await fetch(flaskEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Remove typing animation
        chatBox.removeChild(typingIndicator);

        return data; // Return the processed response
    } catch (error) {
        console.error("Error sending data to Flask:", error);

        // Remove typing animation and show error message
        chatBox.removeChild(typingIndicator);
        sendBotMessage("Sorry, I couldn't get a response from the server.");
        return { success: false };
    }
}


function handleResponse(answer, question) {
    const chatBox = document.getElementById("chat-box");
    let userMessage = createMessageElement("user", answer);
    chatBox.appendChild(userMessage);

    // Save the user response
    chatState.userResponses[chatState.step] = answer;

    // Disable radio buttons for the current question
    disableOptions(question);

    if (chatState.step === 1) {
        // Get user's name
        chatState.userName = answer;
        chatState.chatId = generateChatId(chatState.userName);

        // Send messages to the user and proceed to step 2
        sendBotMessage(`Ok, ${chatState.userName}, you can take this at your own pace. Please feel free sharing your experiences.`);
        sendBotMessage("What is your relationship with the abuser?");
        chatState.step = 2;
    } else if (chatState.step === 2) {
        // Store abuser relationship and move to step 3
        chatState.abuserRelationship = answer;
        sendBotMessageWithOptions("Which incident are you reporting?", ["Recent", "Past"]);
        chatState.step = 3;
    } else if (chatState.step === 3) {
        if (answer === "Recent" || answer === "Past") {
            chatState.incidentType = answer;
            chatState.step = 4;
            if (answer === "Recent") {
                sendBotMessage("Describe the most recent violent act, fear, or threat of violence, and why the temporary order should be entered today without notice to the respondent. Please provide specific details, including the approximate dates and police responses.");
            } else if (answer === "Past") {
                sendBotMessage("Describe the past incidents where you experienced violence, were afraid of injury, or where the respondent threatened to harm or kill you. Please include specific acts, approximate dates, and any police responses.");
            }
        } else {
            sendBotMessage("Please select from the given options: Recent or Past.");
            return;
        }
    } else if (chatState.step === 4) {
        // User has provided the incident description, send to Flask
        const userPrompt = answer;
        sendToFlask(chatState.incidentType, userPrompt).then(data => {
            if (data.success) {
                // Improved message flow
                sendBotMessage("Here is your revised statement:");
                sendBotMessage(data.revised_statement);
                sendBotMessage("To structure the statement more effectively, please consider the following questions:");
                let combinedQuestions = "";
                data.questions.forEach((question, index) => {
                    combinedQuestions += `${question}\n`;
                });
                sendBotMessage(combinedQuestions);
            } else {
                sendBotMessage(data.error || "Sorry, there was an error processing your request.");
            }
            chatState.step = 5;
            nextStep();
        });
        return;
    } else if (chatState.step === 5) {
        sendBotMessage("How has this affected you? Please describe the impact.\n This helps ensure your statement fully reflects your experience.");
        chatState.step = 6;
    } else if (chatState.step === 6) {
        sendBotMessage("Thank you for sharing your responses.");
        chatState.step = 7;
    }
}

// Function to handle the next step in conversation
function nextStep() {
    switch (chatState.step) {
        case 7:
            sendBotMessage("Thank you for sharing your responses.");
            break;
        default:
            break;
    }
}

// Ensure the chat flow follows the correct sequence
function ensureGreeting() {
    if (chatState.step === 0) {
        startChat();
    }
}

// Handle the response for name and other text inputs
userInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                let userMessage = userInput.value.trim();
                if (userMessage !== "") {
                    handleResponse(userMessage);
                    userInput.value = "";
                }
            }
        });

// Button click event for sending messages
document.getElementById("send-button").addEventListener("click", function () {
            let message = userInput.value.trim();
            if (message !== "") {
                handleResponse(message);
                userInput.value = "";
            }
        });

// Disable radio options after selection
function disableOptions(question) {
    let optionsDivs = document.querySelectorAll(".options");
    optionsDivs.forEach(optionsDiv => {
                    let radios = optionsDiv.querySelectorAll(`input[name='${question}']`);
                    radios.forEach(radio => {
                            if (!radio.checked) {
                                radio.disabled = true;
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

    // Reset chatState
    chatState = {
        step: 0,
        userResponses: {},
        userName: "",
        abuserName: "",
        incidentType: null,
        chatId: ""
    };

    startChat();
}

// Function to toggle the chat history sidebar visibility
function toggleChatHistory() {
    let body = document.body;
    let chatContainer = document.querySelector(".chat-container");
    let sidebar = document.getElementById("chat-history-sidebar");
    body.classList.toggle("sidebar-open");
    sidebar.classList.toggle("open");
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