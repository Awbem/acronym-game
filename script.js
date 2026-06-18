const MINIMUM_PLAYERS = 3;
const MAXIMUM_PLAYERS = 8;

const MINIMUM_LETTERS = 4;
const MAXIMUM_LETTERS = 8;

const TZAR_TIME_LIMIT = 15;

const gameState = {
    players: [],
    phase: "lobby",
    currentRound: 0,
    currentTzarIndex: 0,
    letters: "",
    tzarDeadline: null
};

let tzarTimerInterval = null;

/*
    Lobby elements
*/

const lobbyScreen = document.querySelector("#lobby-screen");
const playerForm = document.querySelector("#player-form");
const playerNameInput = document.querySelector("#player-name");
const playerList = document.querySelector("#player-list");
const playerCount = document.querySelector("#player-count");
const lobbyMessage = document.querySelector("#lobby-message");
const startGameButton = document.querySelector(
    "#start-game-button"
);

/*
    Tzar screen elements
*/

const tzarScreen = document.querySelector("#tzar-screen");
const roundLabel = document.querySelector("#round-label");
const tzarHeading = document.querySelector("#tzar-heading");
const tzarTimer = document.querySelector("#tzar-timer");
const lettersForm = document.querySelector("#letters-form");
const lettersInput = document.querySelector("#letters-input");
const lettersMessage = document.querySelector(
    "#letters-message"
);

/*
    Prompt screen elements
*/

const promptScreen = document.querySelector("#prompt-screen");
const promptRoundLabel = document.querySelector(
    "#prompt-round-label"
);
const promptLetters = document.querySelector("#prompt-letters");
const continueButton = document.querySelector(
    "#continue-button"
);

/*
    Event listeners
*/

playerForm.addEventListener("submit", handlePlayerSubmit);
playerList.addEventListener("click", handlePlayerListClick);
startGameButton.addEventListener("click", startGame);
lettersForm.addEventListener("submit", handleLettersSubmit);
lettersInput.addEventListener("input", handleLettersInput);
continueButton.addEventListener("click", handleContinue);

/*
    Lobby functions
*/

function handlePlayerSubmit(event) {
    event.preventDefault();

    const playerName = playerNameInput.value.trim();

    if (playerName === "") {
        return;
    }

    if (gameState.players.length >= MAXIMUM_PLAYERS) {
        lobbyMessage.textContent =
            "The lobby already has the maximum number of players.";

        return;
    }

    const nameIsTaken = gameState.players.some((player) => {
        return (
            player.name.toLowerCase() ===
            playerName.toLowerCase()
        );
    });

    if (nameIsTaken) {
        lobbyMessage.textContent =
            "That player name is already taken.";

        return;
    }

    const newPlayer = {
        id: crypto.randomUUID(),
        name: playerName,
        ready: false,
        score: 0
    };

    gameState.players.push(newPlayer);

    playerForm.reset();
    playerNameInput.focus();

    renderLobby();
}

function handlePlayerListClick(event) {
    const readyButton = event.target.closest(".ready-button");

    if (!readyButton) {
        return;
    }

    const playerId = readyButton.dataset.playerId;

    const selectedPlayer = gameState.players.find((player) => {
        return player.id === playerId;
    });

    if (!selectedPlayer) {
        return;
    }

    selectedPlayer.ready = !selectedPlayer.ready;

    renderLobby();
}

function renderLobby() {
    playerList.innerHTML = "";

    gameState.players.forEach((player, index) => {
        const playerCard = document.createElement("li");
        playerCard.className = "player-card";

        const playerInformation =
            document.createElement("div");

        playerInformation.className = "player-information";

        const playerName = document.createElement("strong");
        playerName.textContent = player.name;

        const playerNumber = document.createElement("span");
        playerNumber.className = "player-number";
        playerNumber.textContent = `Player ${index + 1}`;

        const readyButton = document.createElement("button");
        readyButton.type = "button";
        readyButton.className = "ready-button";
        readyButton.dataset.playerId = player.id;

        if (player.ready) {
            readyButton.textContent = "Ready";
            readyButton.classList.add("is-ready");
        } else {
            readyButton.textContent = "Not Ready";
        }

        playerInformation.append(playerName, playerNumber);
        playerCard.append(playerInformation, readyButton);
        playerList.append(playerCard);
    });

    playerCount.textContent =
        `${gameState.players.length} / ${MAXIMUM_PLAYERS} players`;

    updateLobbyStatus();
}

function updateLobbyStatus() {
    const hasEnoughPlayers =
        gameState.players.length >= MINIMUM_PLAYERS;

    const everyPlayerIsReady =
        hasEnoughPlayers &&
        gameState.players.every((player) => player.ready);

    startGameButton.disabled = !everyPlayerIsReady;

    if (!hasEnoughPlayers) {
        const playersNeeded =
            MINIMUM_PLAYERS - gameState.players.length;

        const playerWord =
            playersNeeded === 1 ? "player" : "players";

        lobbyMessage.textContent =
            `Add ${playersNeeded} more ${playerWord} to begin.`;

        return;
    }

    if (!everyPlayerIsReady) {
        lobbyMessage.textContent =
            "Waiting for every player to mark themselves Ready.";

        return;
    }

    lobbyMessage.textContent =
        "Everyone is ready. The game can begin!";
}

/*
    Game-start functions
*/

function startGame() {
    const everyPlayerIsReady =
        gameState.players.length >= MINIMUM_PLAYERS &&
        gameState.players.every((player) => player.ready);

    if (!everyPlayerIsReady) {
        return;
    }

    gameState.currentRound = 1;
    gameState.currentTzarIndex = 0;

    beginTzarPhase();
}

function beginTzarPhase() {
    gameState.phase = "tzar-input";
    gameState.letters = "";

    showScreen(tzarScreen);

    const currentTzar = getCurrentTzar();

    roundLabel.textContent =
        `Round ${gameState.currentRound}`;

    tzarHeading.textContent =
        `${currentTzar.name} is the Tzar`;

    lettersForm.reset();
    lettersMessage.textContent = "";
    lettersInput.disabled = false;

    startTzarTimer();

    lettersInput.focus();
}

function getCurrentTzar() {
    return gameState.players[gameState.currentTzarIndex];
}

/*
    Letter-entry functions
*/

function handleLettersInput() {
    const cleanedValue = lettersInput.value
        .toUpperCase()
        .replace(/[^A-Z]/g, "");

    lettersInput.value = cleanedValue;
}

function handleLettersSubmit(event) {
    event.preventDefault();

    const letters = cleanLetters(lettersInput.value);

    if (!lettersAreValid(letters)) {
        lettersMessage.textContent =
            `Enter between ${MINIMUM_LETTERS} and ${MAXIMUM_LETTERS} letters.`;

        return;
    }

    lockInLetters(letters);
}

function cleanLetters(value) {
    return value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
}

function lettersAreValid(letters) {
    return (
        letters.length >= MINIMUM_LETTERS &&
        letters.length <= MAXIMUM_LETTERS
    );
}

function lockInLetters(letters) {
    if (gameState.phase !== "tzar-input") {
        return;
    }

    clearInterval(tzarTimerInterval);
    tzarTimerInterval = null;

    gameState.letters = letters;
    gameState.phase = "prompt-reveal";

    lettersInput.disabled = true;

    showPromptScreen();
}

/*
    Timer functions
*/

function startTzarTimer() {
    clearInterval(tzarTimerInterval);

    gameState.tzarDeadline =
        Date.now() + TZAR_TIME_LIMIT * 1000;

    updateTzarTimerDisplay();

    tzarTimerInterval = setInterval(() => {
        updateTzarTimerDisplay();
    }, 250);
}

function updateTzarTimerDisplay() {
    const millisecondsRemaining =
        gameState.tzarDeadline - Date.now();

    const secondsRemaining = Math.max(
        0,
        Math.ceil(millisecondsRemaining / 1000)
    );

    tzarTimer.textContent = secondsRemaining;

    if (millisecondsRemaining <= 0) {
        handleTzarTimeout();
    }
}

function handleTzarTimeout() {
    if (gameState.phase !== "tzar-input") {
        return;
    }

    clearInterval(tzarTimerInterval);
    tzarTimerInterval = null;

    const randomLetters = generateRandomLetters();

    lockInLetters(randomLetters);
}

function generateRandomLetters() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const numberOfLetters =
        getRandomInteger(MINIMUM_LETTERS, MAXIMUM_LETTERS);

    let result = "";

    for (let index = 0; index < numberOfLetters; index += 1) {
        const randomAlphabetIndex =
            getRandomInteger(0, alphabet.length - 1);

        result += alphabet[randomAlphabetIndex];
    }

    return result;
}

function getRandomInteger(minimum, maximum) {
    const range = maximum - minimum + 1;

    return Math.floor(Math.random() * range) + minimum;
}

/*
    Prompt reveal functions
*/

function showPromptScreen() {
    showScreen(promptScreen);

    promptRoundLabel.textContent =
        `Round ${gameState.currentRound}`;

    promptLetters.textContent = gameState.letters;
}

function handleContinue() {
    alert(
        `Next, we will build the response phase for ${gameState.letters}.`
    );
}

/*
    General screen function
*/

function showScreen(screenToShow) {
    const allScreens = document.querySelectorAll(
        ".game-screen"
    );

    allScreens.forEach((screen) => {
        screen.classList.add("hidden");
    });

    screenToShow.classList.remove("hidden");
}

renderLobby();