document.addEventListener('DOMContentLoaded', () => {
  // make sure all our html is loaded before running our javascript
  // this is so that we can put the link to this file in the top of the html file.
  // I still put mine at the bottom from habit - but you could
  const userGrid = document.querySelector('.grid-user');
  const computerGrid = document.querySelector('.grid-computer');
  const displayGrid = document.querySelector('.grid-display');
  const ships = document.querySelectorAll('.ship');
  const destroyer = document.querySelector('.destroyer-container');
  const submarine = document.querySelector('.submarine-container');
  const cruiser = document.querySelector('.cruiser-container');
  const battleship = document.querySelector('.battleship-container');
  const carrier = document.querySelector('.carrier-container');
  const startButton = document.querySelector('#start');
  const rotateButton = document.querySelector('#rotate');
  const turnDisplay = document.querySelector('#whose-go');
  const infoDisplay = document.querySelector('#info');
  const singlePlayerButton = document.querySelector('#singlePlayerButton');
  const multiPlayerButton = document.querySelector('#multiPlayerButton');

  const userSquares = [];
  const computerSquares = [];
  let isHorizontal = true;
  let isGameOver = false;
  let currentPlayer = 'user';
  const width = 10;
  let gameMode = '';
  let playerNum = 0;
  let ready = false;
  let enemyReady = false;
  let allShipsPlaced = false;
  let shotFired = -1;

  // Select Player Mode
  singlePlayerButton.addEventListener('click', startSinglePlayer);
  multiPlayerButton.addEventListener('click', startMultiPlayer);

  // Single Player
  function startSinglePlayer() {
    gameMode = 'singlePlayer';

    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]);

    startButton.addEventListener('click', playGameSingle);
  }

  // Multiplayer
  function startMultiPlayer() {
    gameMode = 'multiPlayer';

    const socket = io();

    // Get your player number
    socket.on('player-number', (num) => {
      if (num === -1) {
        infoDisplay.textContent = 'Sorry, the server is full';
      } else {
        playerNum = parseInt(num);
        if (playerNum === 1) {
          currentPlayer = 'enemy';
        }

        console.log(playerNum);

        // Get other player status
        socket.emit('check-players');
      }
    });

    // Another player has connected or disconnected
    socket.on('player-connection', (num) => {
      console.log(`Player number ${num} has connected or disconnected`);
      playerConnectedOrDisconnected(num);
    });

    function playerConnectedOrDisconnected(num) {
      // p1 and p2 classes are in our css
      let player = `.p${parseInt(num) + 1}`;
      document
        .querySelector(`${player} .connected span`)
        .classList.toggle('green');
      if (parseInt(num) === playerNum) {
        document.querySelector(player).style.fontWeight = 'bold';
      }
    }

    // On enemy ready
    socket.on('enemy-ready', (num) => {
      enemyReady = true;
      playerReady(num);
      if (ready) playGameMulti(socket);
    });

    // Check player status
    socket.on('check-players', (players) => {
      players.forEach((p, i) => {
        if (p.connected) playerConnectedOrDisconnected(i);
        if (p.ready) {
          playerReady(i);
          if (i != playerReady) enemyReady = true;
        }
      });
    });

    // On Timeout
    socket.on('timeout', () => {
      infoDisplay.textContent = 'You have reached the 10 minute limit';
    });

    // Ready button click
    startButton.addEventListener('click', () => {
      if (allShipsPlaced) playGameMulti(socket);
      else infoDisplay.textContent = 'Please place all ships';
    });

    // Setup event listener for firing
    computerSquares.forEach((square) => {
      square.addEventListener('click', () => {
        if (currentPlayer === 'user' && ready && enemyReady) {
          shotFired = square.dataset.id;
          socket.emit('fire', shotFired);
        }
      });
    });

    // On Fire Received
    socket.on('fire', (id) => {
      enemyGo(id);
      const square = userSquares[id];
      socket.emit('fire-reply', square.classList);
      playGameMulti(socket);
    });

    // On Fire Reply Received
    socket.on('fire-reply', (classList) => {
      revealSquare(classList);
      playGameMulti(socket); //switches who's turn
    });
  }

  // **************************************
  // Ania's code - gameplay below
  // **************************************
  // Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width * width; i++) {
      const square = document.createElement('div');
      square.dataset.id = i;
      grid.appendChild(square);
      squares.push(square);
    }
  }

  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);

  //Ships
  const shipArray = [
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width],
      ],
    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, width, width * 2],
      ],
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width * 2],
      ],
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width * 2, width * 3],
      ],
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width * 2, width * 3, width * 4],
      ],
    },
  ];

  // Draw the computer's ships in random locations
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length);
    let current = ship.directions[randomDirection];
    if (randomDirection === 0) direction = 1;
    if (randomDirection === 1) direction = 10;
    let randomStart = Math.abs(
      Math.floor(
        Math.random() * computerSquares.length -
          ship.directions[0].length * direction
      )
    );

    const isTaken = current.some((index) =>
      computerSquares[randomStart + index].classList.contains('taken')
    );
    const isAtRightEdge = current.some(
      (index) => (randomStart + index) % width === width - 1
    );
    const isAtLeftEdge = current.some(
      (index) => (randomStart + index) % width === 0
    );

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
      current.forEach((index) =>
        computerSquares[randomStart + index].classList.add('taken', ship.name)
      );
      console.log(randomStart);
    } else {
      generate(ship);
    }
  }

  // rotate the ships
  function rotate() {
    if (isHorizontal) {
      isHorizontal = false;
    } else {
      isHorizontal = true;
    }
    destroyer.classList.toggle('destroyer-container-vertical');
    submarine.classList.toggle('submarine-container-vertical');
    cruiser.classList.toggle('cruiser-container-vertical');
    battleship.classList.toggle('battleship-container-vertical');
    carrier.classList.toggle('carrier-container-vertical');
  }
  rotateButton.addEventListener('click', rotate);

  // move around user ship
  ships.forEach((ship) => ship.addEventListener('dragstart', dragStart));
  userSquares.forEach((square) =>
    square.addEventListener('dragstart', dragStart)
  );
  userSquares.forEach((square) =>
    square.addEventListener('dragover', dragOver)
  );
  userSquares.forEach((square) =>
    square.addEventListener('dragenter', dragEnter)
  );
  userSquares.forEach((square) =>
    square.addEventListener('dragleave', dragLeave)
  );
  userSquares.forEach((square) => square.addEventListener('drop', dragDrop));
  userSquares.forEach((square) => square.addEventListener('dragend', dragEnd));

  let selectedShipNameWithIndex;
  let draggedShip;
  let draggedShipLength;

  ships.forEach((ship) =>
    ship.addEventListener('mousedown', (e) => {
      selectedShipNameWithIndex = e.target.id;
      console.log(selectedShipNameWithIndex);
    })
  );

  function dragStart() {
    // console.log(e.target);
    // console.log(this);
    // so e.target and this are the same
    draggedShip = this;
    draggedShipLength = this.children.length; // replaces this.childNodes.length to get around random spaces as nodes issue
    // console.log(draggedShip);
    console.log(draggedShipLength);
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function dragEnter(e) {
    e.preventDefault();
  }

  function dragLeave() {
    console.log('drag leave');
  }

  function dragDrop() {
    let shipNameWithLastId =
      draggedShip.children[draggedShip.children.length - 1].id; //get last child node , because draggedShip.lastChild.id
    // is picking up text between divs that isn't really there
    // and just formatting the html so there are no spaces isn't going to work for me because I have prettier formatting it on saves.
    // let shipNameWithLastId = draggedShip.lastChild.id;   <-- replaces this

    let shipClass = shipNameWithLastId.slice(0, -2);
    console.log(shipClass);
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1)); //0 or 1 or 3 or 4 or 2
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);

    // array where you aren't allowed to put a ship in, like the off the right side.
    // it will stop it wrapping around
    const notAllowedHorizontal = [
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81,
      91, 2, 12, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73,
      83, 93,
    ];
    const notAllowedVertical = [
      99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82,
      81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64,
      63, 62, 61, 60,
    ];
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(
      0,
      10 * lastShipIndex
    );
    let newNotAllowedVerticall = notAllowedVertical.splice(
      0,
      10 * lastShipIndex
    );

    let selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

    // console.log('shipLastId = ' + shipLastId);
    // console.log('selectedShipIndex = ' + selectedShipIndex);
    shipLastId = shipLastId - selectedShipIndex;
    console.log('shipLastId now = ' + shipLastId);

    //
    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i = 0; i < draggedShipLength; i++) {
        userSquares[
          parseInt(this.dataset.id) - selectedShipIndex + i
        ].classList.add('taken', shipClass);
      }
    } else if (!isHorizontal && !newNotAllowedVerticall.includes(shipLastId)) {
      for (let i = 0; i < draggedShipLength; i++) {
        userSquares[
          parseInt(this.dataset.id) - selectedShipIndex + width * i
        ].classList.add('taken', shipClass);
      }
    } else return;

    // then remove it from the availble display grid
    displayGrid.removeChild(draggedShip);
    if (!displayGrid.querySelector('.ship')) allShipsPlaced = true;
  }

  function dragEnd() {
    console.log('dragend');
  }

  // Game Logic for Multi Player
  function playGameMulti(socket) {
    if (isGameOver) return;
    if (!ready) {
      socket.emit('player-ready');
      ready = true;
      playerReady(playerNum);
    }

    if (enemyReady) {
      if (currentPlayer === 'user') {
        turnDisplay.textContent = 'Your Go';
      }
      if (currentPlayer === 'enemy') {
        turnDisplay.textContent = "Enemy's Go";
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle('green');
  }

  // Game Logic for Single Player
  function playGameSingle() {
    if (isGameOver) return;
    if (currentPlayer === 'user') {
      turnDisplay.textContent = 'Your Turn';
      computerSquares.forEach((square) =>
        square.addEventListener('click', function (e) {
          shotFired = square.datatset.id;
          revealSquare(square.classList);
        })
      );
    }
    if (currentPlayer === 'enemy') {
      turnDisplay.textContent = 'Computers Turn';
      //function computerGo
      setTimeout(enemyGo, 1000);
    }
  }

  let destroyerCount = 0;
  let submarineCount = 0;
  let cruiserCount = 0;
  let battleshipCount = 0;
  let carrierCount = 0;

  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(
      `div[data-id='${shotFired}']`
    );
    const obj = Object.values(classList);

    if (
      !enemySquare.classList.contains('boom') &&
      currentPlayer === 'user' &&
      !isGameOver
    ) {
      if (obj.includes('destroyer')) destroyerCount++;
      if (obj.includes('submarine')) submarineCount++;
      if (obj.includes('cruiser')) cruiserCount++;
      if (obj.includes('battleship')) battleshipCount++;
      if (obj.includes('carrier')) carrierCount++;
    }

    if (obj.includes('taken')) {
      enemySquare.classList.add('boom');
    } else {
      enemySquare.classList.add('miss');
    }

    checkForWins();
    currentPlayer = 'enemy';
    if (gameMode === 'singlePlayer') playGameSingle();
  }

  let cpuDestroyerCount = 0;
  let cpuSubmarineCount = 0;
  let cpuCruiserCount = 0;
  let cpuBattleshipCount = 0;
  let cpuCarrierCount = 0;

  function enemyGo(square) {
    // let random = Math.floor(Math.random() * userSquares.length);
    if (gameMode === 'singlePlayer')
      square = Math.floor(Math.random() * userSquares.length);

    if (!userSquares[square].classList.contains('boom')) {
      userSquares[square].classList.add('boom');
      if (userSquares[square].classList.contains('destroyer'))
        cpuDestroyerCount++;
      if (userSquares[square].classList.contains('submarine'))
        cpuSubmarineCount++;
      if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
      if (userSquares[square].classList.contains('battleship'))
        cpuBattleshipCount++;
      if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++;
    } else if (gameMode === 'singlePlayer') enemyGo();
    currentPlayer = 'user';
    turnDisplay.textContent = 'Your Turn';
  }

  function checkForWins() {
    let enemy = 'computer';
    if (gameMode === 'multiPlayer') enemy = 'enemy';
    if (destroyerCount == 2) {
      infoDisplay.textContent = `You sunk the ${enemy}'s destroyer`;
      destroyerCount = 10;
    }
    if (submarineCount == 3) {
      infoDisplay.textContent = `You sunk the ${enemy}'s submarine`;
      submarineCount = 10;
    }
    if (cruiserCount == 3) {
      infoDisplay.textContent = `You sunk the ${enemy}'s cruiser`;
      cruiserCount = 10;
    }
    if (battleshipCount == 4) {
      infoDisplay.textContent = `You sunk the ${enemy}'s battleship`;
      battleshipCount = 10;
    }
    if (carrierCount == 4) {
      infoDisplay.textContent = `You sunk the ${enemy}'s carriership`;
      carrierCount = 10;
    }
    if (cpuDestroyerCount == 2) {
      infoDisplay.textContent = `${enemy} sunk your destroyer`;
      cpuDestroyerCount = 10;
    }
    if (cpuSubmarineCount == 3) {
      infoDisplay.textContent = `${enemy} sunk your submarine`;
      cpuSubmarineCount = 10;
    }
    if (cpuCruiserCount == 3) {
      infoDisplay.textContent = `${enemy} sunk your cruiser`;
      cpuCruiserCount = 10;
    }
    if (cpuBattleshipCount == 4) {
      infoDisplay.textContent = `${enemy} sunk your battleship`;
      cpuBattleshipCount = 10;
    }
    if (cpuCarrierCount == 4) {
      infoDisplay.textContent = `${enemy} sunk your carriership`;
      cpuCarrierCount = 10;
    }
    if (
      destroyerCount +
        submarineCount +
        cruiserCount +
        battleshipCount +
        carrierCount ===
      50
    ) {
      infoDisplay.textContent = 'YOU WIN';
      gameOver();
    }

    if (
      cpuDestroyerCount +
        cpuSubmarineCount +
        cpuCruiserCount +
        cpuBattleshipCount +
        cpuCarrierCount ===
      50
    ) {
      infoDisplay.textContent = `${enemy.toUpperCase()} WINS`;
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    startButton.removeEventListener('click', playGameSingle);
  }
});

//12118
