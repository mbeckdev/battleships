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
  const userSquares = [];
  const computerSquares = [];
  let isHorizontal = true;

  const width = 10;

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

  generate(shipArray[0]);
  generate(shipArray[1]);
  generate(shipArray[2]);
  generate(shipArray[3]);
  generate(shipArray[4]);

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
  }
  function dragEnd() {}
});
