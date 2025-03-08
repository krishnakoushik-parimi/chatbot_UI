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
    chatId: "",
    originalText: "",
    intermediateStatement: "",
    questions: [],
    answers: [],
    followUpQuestions: [],
    currentQuestionIndex: 0,
    followUpResponses: [],
    errorDisplayed: false // Added errorDisplayed to chatState
};

let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

// Initialize chat history and dark mode on page load
window.onload = function() {
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
            chatHistory[existingChatIndex] = { ...chatState,
                messages: chatBox.innerHTML
            };
        } else {
            chatHistory.push({ ...chatState,
                messages: chatBox.innerHTML
            });
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
        chatState = { ...chat
        };
        chatBox.innerHTML = chat.messages;
    }
}

// Function to update the sidebar chat history UI
function updateChatHistoryUI() {
    chatList.innerHTML = "";
    chatHistory.forEach(chat => addChatToSidebar(chat));
}

// Function to send bot message with typing animation
function sendBotMessage(message, isHTML = false) {
    let typingIndicator = showTypingIndicator();
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    setTimeout(() => {
        chatBox.removeChild(typingIndicator); // Remove typing animation
        let botMessage = createMessageElement("bot", message, isHTML);
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
    dots.innerHTML = `...`; // Typing animation
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
    console.log("🛠️ Debugging sendToFlask...");
    console.log("📌 incidentType:", incidentType);
    console.log("📌 prompt:", prompt);

    if (!incidentType || !prompt) {
        console.error("❌ ERROR: Missing incidentType or prompt!");
        sendBotMessage("Something went wrong. Please try again.");
        return;
    }

    const flaskEndpoint = 'http://149.165.159.130:5000/process_statement';
    let typingIndicator = showTypingIndicator();
    chatBox.appendChild(typingIndicator);

    try {
        const requestBody = {
            "question_type": incidentType,
            "prompt": prompt
        };

        console.log("🚀 Sending request to Flask:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(flaskEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Response from Flask:", data);

        chatBox.removeChild(typingIndicator);

        if (!data.success) {
            throw new Error(data.error || "An error occurred while processing your request.");
        }

        sendBotMessage("Here is your revised statement:");
        sendBotMessage(data.response.revised);

        chatState.originalText = data.response.original;
        chatState.intermediateStatement = data.response.revised;
        chatState.questions = data.response.follow_up_questions;
        chatState.currentQuestionIndex = 0;
        chatState.answers = [];

        askQuestions();

    } catch (error) {
        console.error("❌ Error sending data to Flask:", error);
        chatBox.removeChild(typingIndicator);
        sendBotMessage("Sorry, I couldn't process your request. Please try again.");
    }
}





async function sendToFinalizeEndpoint(originalText, intermediateStatement, questions, answers) {
    const finalizeEndpoint = 'http://149.165.159.130:5000/final_output';
    // Show typing animation
    let typingIndicator = showTypingIndicator();
    chatBox.appendChild(typingIndicator);
    try {
        const requestBody = {
            "original_text": originalText,
            "intermediate_statement": intermediateStatement,
            "questions": questions,
            "answers": answers
        };
        const response = await fetch(finalizeEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        // Remove typing animation
        chatBox.removeChild(typingIndicator);
        if (!data.success) {
            throw new Error(data.error || "An error occurred while finalizing your statement.");
        }
        return data;
    } catch (error) {
        console.error("Error sending data to finalize endpoint:", error);
        // Remove typing animation and send error message **only once**
        chatBox.removeChild(typingIndicator);
        if (!chatState.errorDisplayed) {
            sendBotMessage("Sorry, I couldn't process your request. Please try again later.");
            chatState.errorDisplayed = true; // Prevent multiple error messages
        }
        return null; // Stop further flow
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
            chatState.incidentType = answer.toLowerCase(); // Ensure correct casing
            chatState.step = 4;
            if (answer === "Recent") {
                sendBotMessage("Describe the most recent violent act, fear, or threat of violence, and why the temporary order should be entered today without notice to the respondent. Please provide specific details, including the approximate dates and police responses.");
            } else {
                sendBotMessage("Describe the past incidents where you experienced violence, were afraid of injury, or where the respondent threatened to harm or kill you. Please include specific acts, approximate dates, and any police responses.");
            }
        } else {
            sendBotMessage("Please select from the given options: Recent or Past.");
            return;
        }
    } else if (chatState.step === 4) {
        chatState.incidentType = chatState.incidentType || "recent"; // Ensure a default value
        console.log("🚀 Sending to Flask with:", chatState.incidentType, answer);

        // ✅ Await the response properly
        sendToFlask(chatState.incidentType, answer)
            .then(data => {
                if (!data || !data.success) {
                    console.error("❌ Error: Invalid response from Flask");
                    sendBotMessage("Sorry, there was an error processing your request.");
                    return;
                }

                // ✅ Store returned data properly
                chatState.originalText = data.response.original;
                chatState.intermediateStatement = data.response.revised;
                chatState.questions = data.response.follow_up_questions || [];
                chatState.currentQuestionIndex = 0;
                chatState.answers = [];
                chatState.step = 5;

                if (chatState.questions.length > 0) {
                    askNextQuestion(); // ✅ Use askNextQuestion() instead of undefined function
                } else {
                    sendBotMessage("No follow-up questions were generated.");
                    prepareDataForSecondEndpoint();
                }
            })
            .catch(error => {
                console.error("❌ Error sending data to Flask:", error);
                sendBotMessage("Sorry, I couldn't process your request. Please try again.");
            });
        
    } else if (chatState.step === 5) {
        // Handling follow-up question responses
        chatState.answers.push(answer);

        if (chatState.currentQuestionIndex < chatState.questions.length) {
            askQuestions(); // ✅ Use the correct function
        } else {
            chatState.step = 6;
            prepareDataForSecondEndpoint();
        }
    } else if (chatState.step === 6) {
        sendBotMessage("How has this affected you? Please describe the impact.\n This helps ensure your statement fully reflects your experience.");
        chatState.step = 7;
    } else if (chatState.step === 7) {
        sendBotMessage("Thank you for sharing your responses.");
        chatState.step = 8;
    }
}

// Function to ask the next follow-up question
function askQuestions() {
    if (chatState.questions.length > 0 && chatState.currentQuestionIndex < chatState.questions.length) {
        const question = chatState.questions[chatState.currentQuestionIndex];
        sendBotMessage(question);
        chatState.currentQuestionIndex++;
    } else {
        // No more questions, proceed to the next phase
        chatState.step = 6;
        prepareDataForSecondEndpoint();
    }
}

// Function to handle the next step in conversation
function nextStep() {
    switch (chatState.step) {
        case 7:
            sendBotMessage("Thank you for sharing your responses.");
            break;
        case 5:
            sendBotMessage("How has this affected you? Please describe the impact.\n This helps ensure your statement fully reflects your experience.");
            chatState.step = 6;
            break;
        case 6:
            sendBotMessage("Thank you for sharing your responses.");
            chatState.step = 7;
            break;
        default:
            break;
    }
}

function prepareDataForSecondEndpoint() {
    const data = {
        original_text: chatState.originalText,
        intermediate_statement: chatState.intermediateStatement,
        questions: chatState.questions,
        answers: chatState.answers
    };

    const formattedData = JSON.stringify(data, null, 2);
    sendBotMessage(`Data for second endpoint:\n${formattedData}`);
    //console.log("Data prepared for the second endpoint:", data);

    chatState.step = 6;
    //nextStep();
    finalizeStatement();
}

// Function to finalize statement using the new endpoint
async function finalizeStatement() {
    const {
        originalText,
        intermediateStatement,
        questions,
        answers
    } = chatState;
    const useSampleData = false; // Set this to TRUE to use sample data, FALSE to use the Flask endpoint
    try {
        let data; // Declare data outside the if/else blocks

        if (useSampleData) {
            // Simulate the response from the second endpoint
            data = {
                "success": true,
                "final_response": {
                    "Final_Statement": "This is a simulated final statement."
                }
            };
            console.log("Simulated Second Endpoint Response:", data); // Debugging: Log the entire data object
        } else {
            const response = await sendToFinalizeEndpoint(originalText, intermediateStatement, questions, answers);

            if (!response) return; // Stop execution if there's no response

            if (response.success) {
                sendBotMessage("Here is your final statement:");
                sendBotMessage(response.final_response.Final_Statement);
                if (response.final_response.follow_up_questions && response.final_response.follow_up_questions.length > 0) {
                    chatState.questions = response.final_response.follow_up_questions;
                    chatState.currentQuestionIndex = 0;
                    askNextQuestion();
                } else {
                    sendBotMessage("The statement is finalized. Thank you for your input.");
                    chatState.step = 7;
                    nextStep();
                }
            } else {
                if (!chatState.errorDisplayed) {
                    sendBotMessage("Sorry, there was an error finalizing your statement.");
                    chatState.errorDisplayed = true; // Prevent multiple error messages
                }
            }
            return;
        }
        // MODIFICATION START - Display final statement and questions one by one
        sendBotMessage("Here is your final statement:");
        sendBotMessage(data.final_response.Final_Statement);
        sendBotMessage("The statement is finalized. Thank you for your input.");
        chatState.step = 7;
        nextStep();
    } catch (error) {
        console.error("Error sending data to finalize endpoint:", error);
        // Remove typing animation and send error message **only once**
        chatBox.removeChild(typingIndicator);
        if (!chatState.errorDisplayed) {
            sendBotMessage("Sorry, I couldn't process your request. Please try again later.");
            chatState.errorDisplayed = true; // Prevent multiple error messages
        }
        return null; // Stop further flow
    }
}

// Ensure the chat flow follows the correct sequence
function ensureGreeting() {
    if (chatState.step === 0) {
        startChat();
    }
}

// Handle the response for name and other text inputs
userInput.addEventListener("keydown", function(event) {
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
document.getElementById("send-button").addEventListener("click", function() {
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

function createMessageElement(sender, text, isHTML = false) {
    let messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;
    let profilePic = document.createElement("img");
    profilePic.className = "profile-pic";
    profilePic.src = sender === "user" ? "user.png" : "bot-2.png";
    profilePic.alt = sender === "user" ? "User Profile" : "Bot Profile";
    let messageText = document.createElement("div");
    messageText.className = "text";
    if (isHTML) {
        messageText.innerHTML = text; // Render as HTML (supports <b>, etc.)
    } else {
        messageText.textContent = text; // Render as plain text
    }
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
        chatId: "",
        originalText: "",
        intermediateStatement: "",
        questions: [],
        answers: [],
        followUpQuestions: [],
        currentQuestionIndex: 0,
        followUpResponses: [],
        errorDisplayed: false // Also reset errorDisplayed here!
    };
    startChat();
} // MISSING BRACE HERE

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