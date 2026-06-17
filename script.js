const MINIMUM_PLAYERS = 3;
const MAXIMUM_PLAYERS = 8;

const gameState = {
    players: [],
    phase: "lobby"
};

const playerForm = document.querySelector("#player-form");
const playerNameInput = document.querySelector("#player-name");
const playerList = document.querySelector("#player-list");
const playerCount = document.querySelector("#player-count");
const lobbyMessage = document.querySelector("#lobby-message");
const startGameButton = document.querySelector("#start-game-button");

playerForm.addEventListener("submit", handlePlayerSubmit);
playerList.addEventListener("click", handlePlayerListClick);
startGameButton.addEventListener("click", startGame);

function handlePlayerSubmit(event) {
    event.preventDefault();

    const playerName = playerNameInput.value.trim();

    if (playerName === "") {
        return;
    }

    if (gameState.players.length >= MAXIMUM_PLAYERS) {
        return;
    }

    const nameIsTaken = gameState.players.some((player) => {
        return player.name.toLowerCase() === playerName.toLowerCase();
    });

    if (nameIsTaken) {
        lobbyMessage.textContent = "That player name is already taken.";
        return;
    }

    const newPlayer = {
        id: crypto.randomUUID(),
        name: playerName,
        ready: false,
        score: 0
    };

    gameState.players.push(newPlayer);

    playerForm.requestFullscreen();
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

function renderLobby () {
    playerList.innerHTML = "";

    gameState.players.forEach((player, index) => {
        const playerCard = document.createElement("li");
        playerCard.className = "player-card";

        const playerInformation = document.createElement("div");
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
        `${gameState.players.length} / ${MAXIMUM_PLAYERS} Players`;

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
        
        lobbyMessage.textContent =
            `Add ${playersNeeded} more ${playerNeeded === 1 ? "player" : "players"} to begin.`;

        return;
    }

    if (!everyPlayerIsReady) {
        lobbyMessage.textContent =
            "Waiting for every player to mark themselves as Ready.";

        return;
    }

    lobbyMessage.textContent = 
        "Everyone is ready. The game can begin!";
}

function startGame() {
    gameState.phase = "tzar-input";

    const firstTzar = gameState.players[0];

    alert(
        `${firstTzar.name} is Player 1 and will be the first Tzar.`
    );
}

renderLobby();