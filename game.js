document.addEventListener("DOMContentLoaded", () => {
    let selectedPiece = null;
    let currentTurn = "white";
    let enPassantTarget = null;
    const turnDisplay = document.querySelector("h2");

    /**
     * 
     * @param {*} fromIndex 
     * @param {*} toIndex 
     * @param {*} step 
     * @returns 
     */
    function isPathClear(fromIndex, toIndex, step) {
        const cells = document.querySelectorAll(".item");
        let i = fromIndex;
        while (i !== toIndex) {
            i += step;
            const cellElement = cells[i].firstElementChild
            const cellHasPiece = !!cellElement
            if (i === toIndex && cellHasPiece) {
                return cellElement.alt.includes(currentTurn === "white" ? "black" : "white");
            }
            if (cellHasPiece) return false;
        }
        return true;
    }

    /**
     * Función que valida si el movimiento de una pieza es válido
     * @param {*} piece html de la pieza que se mueve
     * @param {*} fromCell casilla inicial del array de html de 64 casillas
     * @param {*} toCell casilla final del array de html de 64 casillas
     * @returns verdadero si el movimiento es válido. Falso si no se puede hacer
     */
    function isValidMove(piece, fromCell, toCell) {
        const pieceType = piece.alt.split("-")[1];
        const fromIndex = Array.from(fromCell.parentNode.children).indexOf(fromCell);
        const toIndex = Array.from(toCell.parentNode.children).indexOf(toCell);
        const rowDiff = Math.floor(toIndex / 8) - Math.floor(fromIndex / 8);
        const colDiff = (toIndex % 8) - (fromIndex % 8);
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        const isGoingDown = rowDiff > 0;
        const isGoingRight = colDiff > 0;

        switch (pieceType) {
            case "pawn":
                const direction = piece.alt.includes("white") ? -1 : 1;
                const startRow = piece.alt.includes("white") ? 6 : 1;
                const toCellHasPiece = !!toCell.firstChild;
                if (colDiff === 0 && rowDiff === direction && !toCellHasPiece) return true;
                const isPawnAtStartRow = Math.floor(fromIndex / 8) === startRow
                if (colDiff === 0 && rowDiff === 2 * direction && isPawnAtStartRow && !toCellHasPiece) {
                    enPassantTarget = toCell;
                    return true;
                }

                const isPawnEating = absColDiff === 1 && rowDiff === direction
                if (isPawnEating && toCellHasPiece) return true;
                const existsEnPassant = !!enPassantTarget
                const indexOfEnPassantTarget = Array.from(toCell.parentNode.children).indexOf(enPassantTarget)
                const canMovingPieceEatEnPassant = Math.abs(indexOfEnPassantTarget - fromIndex) === 1
                if (existsEnPassant && canMovingPieceEatEnPassant && isPawnEating) {
                    enPassantTarget.innerHTML = "";
                    return true;
                }
                break;
            case "rook":
                if ((colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) ||
                    (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1))) return true;
                break;
            case "horse":
                if ((absColDiff === 2 && absRowDiff === 1) || (absColDiff === 1 && absRowDiff === 2)) return true;
                break;
            case "bishop":
                const step = getDiagonalStep(isGoingDown, isGoingRight);
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, step)) return true;
                break;
            case "queen":
                const isDiagonalMove = absRowDiff === absColDiff
                const isVerticalMove = colDiff === 0
                const isHorizontalMove = rowDiff === 0

                const diagonalStep = getDiagonalStep(isGoingDown, isGoingRight);
                const verticalStep = getVerticalStep(isGoingDown);
                const horizontalStep = getHorizontalStep(isGoingRight);
                if ((isDiagonalMove && isPathClear(fromIndex, toIndex, diagonalStep)) ||
                    (isVerticalMove && isPathClear(fromIndex, toIndex, verticalStep)) ||
                    (isHorizontalMove && isPathClear(fromIndex, toIndex, horizontalStep))) return true;
                break;
            case "king":
                if (absRowDiff <= 1 && absColDiff <= 1) return true;
                break;
        }
        return false;
    }

    function getDiagonalStep(isGoingDown, isGoingRight) {
        return (isGoingDown ? 8 : -8) + (isGoingRight ? 1 : -1)
    }

    function getVerticalStep(isGoingDown) {
        return isGoingDown ? 8 : -8
    }

    function getHorizontalStep(isGoingRight) {
        return isGoingRight ? 1 : -1
    }

    function isKingInCheck(color) {
        const kingPosition = document.querySelector(`img[alt='${color}-king']`).parentElement;
        return Array.from(document.querySelectorAll(".item img"))
            .filter(img => !img.alt.includes(color))
            .some(enemy => isValidMove(enemy, enemy.parentElement, kingPosition));
    }

    function checkmate() {
        const kings = document.querySelectorAll("img[alt*='king']");
        if (kings.length < 2) {
            const winner = kings[0].alt.includes("white") ? "Blancas" : "Negras";
            alert(`${winner} ganan por jaque mate!`);
            location.reload();
        }
    }

    document.querySelectorAll(".item img").forEach(piece => {
        piece.draggable = true;
        piece.addEventListener("dragstart", (e) => {
            if ((currentTurn === "white" && piece.alt.includes("white")) ||
                (currentTurn === "black" && piece.alt.includes("black"))) {
                selectedPiece = piece;
                e.dataTransfer.setData("text", "");
            } else {
                e.preventDefault();
            }
        });
    });

    document.querySelectorAll(".item").forEach(cell => {
        cell.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        cell.addEventListener("drop", (e) => {
            e.preventDefault();
            if (selectedPiece) {
                const fromCell = selectedPiece.parentElement;
                if (cell !== fromCell && isValidMove(selectedPiece, fromCell, cell)) {
                    const previousParent = selectedPiece.parentElement;
                    cell.innerHTML = "";
                    cell.appendChild(selectedPiece);
                    if (isKingInCheck(currentTurn)) {
                        alert("Movimiento inválido, el rey queda en jaque.");
                        previousParent.appendChild(selectedPiece);
                        return;
                    }
                    if (selectedPiece.alt.includes("pawn") && (Math.floor(Array.from(cell.parentNode.children).indexOf(cell) / 8) === 0 ||
                        Math.floor(Array.from(cell.parentNode.children).indexOf(cell) / 8) === 7)) {
                        let newPiece = "queen";
                        while (!["queen", "rook", "bishop", "horse"].includes(newPiece)) {
                            newPiece = prompt("Promoción de peón: elige reina, torre, alfil o caballo").toLowerCase();
                        }
                        selectedPiece.alt = `${currentTurn}-${newPiece}`;
                    }
                    currentTurn = currentTurn === "white" ? "black" : "white";
                    turnDisplay.textContent = `Es turno del: ${currentTurn}`;
                    checkmate();
                }
            }
        });
    });
});

