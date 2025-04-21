document.addEventListener("DOMContentLoaded", () => {
    let selectedPiece = null;
    let currentTurn = "white";
    let enPassantTarget = null;
    const turnDisplay = document.querySelector("h2");
    const board = document.querySelector(".wrapper");
    const cells = Array.from(board.children);

    function getIndex(cell) {
        return cells.indexOf(cell);
    }

    function getCell(index) {
        return cells[index];
    }

    function getRowCol(index) {
        return { row: Math.floor(index / 8), col: index % 8 };
    }

    function isPathClear(fromIndex, toIndex, step) {
        let i = fromIndex + step;
        while (i !== toIndex) {
            if (getCell(i).firstChild) return false;
            i += step;
        }
        return true;
    }

    function isValidMove(piece, fromCell, toCell) {
        const pieceType = piece.alt.split("-")[1];
        const fromIndex = getIndex(fromCell);
        const toIndex = getIndex(toCell);
        const { row: fromRow, col: fromCol } = getRowCol(fromIndex);
        const { row: toRow, col: toCol } = getRowCol(toIndex);
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        const isOpponent = toCell.firstChild && !toCell.firstChild.alt.includes(currentTurn);

        switch (pieceType) {
            case "pawn":
                const direction = piece.alt.includes("white") ? -1 : 1;
                const startRow = piece.alt.includes("white") ? 6 : 1;
                // Movimiento hacia adelante
                if (colDiff === 0 && rowDiff === direction && !toCell.firstChild) return true;
                // Primer movimiento de dos casillas
                if (colDiff === 0 && rowDiff === 2 * direction && fromRow === startRow && !toCell.firstChild &&
                    !getCell(fromIndex + direction * 8).firstChild) {
                    enPassantTarget = getCell(toIndex - direction * 8);
                    return true;
                }
                // Captura diagonal
                if (absColDiff === 1 && rowDiff === direction && isOpponent) return true;
                // Captura al paso
                if (enPassantTarget && toCell === enPassantTarget && absColDiff === 1 && rowDiff === direction && !toCell.firstChild) {
                    const capturedPawn = getCell(getIndex(toCell) - direction * 8);
                    capturedPawn.innerHTML = "";
                    return true;
                }
                break;
            case "rook":
                if (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) return true;
                if (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1)) return true;
                break;
            case "horse":
                if ((absColDiff === 2 && absRowDiff === 1) || (absColDiff === 1 && absRowDiff === 2)) return true;
                break;
            case "bishop":
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8 + (colDiff > 0 ? 1 : -1))) return true;
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8 + (colDiff < 0 ? -1 : 1))) return true;
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, rowDiff < 0 ? -8 : 8 + (colDiff > 0 ? 1 : -1))) return true;
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, rowDiff < 0 ? -8 : 8 + (colDiff < 0 ? -1 : 1))) return true;
                break;
            case "queen":
                if ((absRowDiff === absColDiff &&
                     (isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8 + (colDiff > 0 ? 1 : -1)) ||
                      isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8 + (colDiff < 0 ? -1 : 1)) ||
                      isPathClear(fromIndex, toIndex, rowDiff < 0 ? -8 : 8 + (colDiff > 0 ? 1 : -1)) ||
                      isPathClear(fromIndex, toIndex, rowDiff < 0 ? -8 : 8 + (colDiff < 0 ? -1 : 1)))) ||
                    (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) ||
                    (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1))) return true;
                break;
            case "king":
                if (absRowDiff <= 1 && absColDiff <= 1) return true;
                // Enroque (se necesita más lógica aún para esto, como verificar si la torre no se ha movido, el rey no está en jaque, etc.)
                break;
        }
        return false;
    }

    function isKingInCheck(color) {
        const kingCell = document.querySelector(`img[alt='${color}-king']`).parentElement;
        return cells.some(cell => {
            if (cell.firstChild && !cell.firstChild.alt.includes(color)) {
                return isValidMove(cell.firstChild, cell, kingCell);
            }
            return false;
        });
    }

    function checkmate() {
        const kingWhite = document.querySelector("img[alt='white-king']");
        const kingBlack = document.querySelector("img[alt='black-king']");
        if (!kingWhite) {
            alert("¡Negras ganan por jaque mate!");
            location.reload();
            return;
        }
        if (!kingBlack) {
            alert("¡Blancas ganan por jaque mate!");
            location.reload();
            return;
        }
        // Aquí iría una lógica más completa para detectar el jaque mate real,
        // verificando si el rey tiene movimientos legales.
    }

    function handleDragStart(e) {
        const piece = e.target;
        if ((currentTurn === "white" && piece.alt.includes("white")) ||
            (currentTurn === "black" && piece.alt.includes("black"))) {
            selectedPiece = piece;
            e.dataTransfer.setData("text/plain", ""); // Necesario para Firefox
        } else {
            e.preventDefault();
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        if (selectedPiece) {
            const toCell = e.currentTarget;
            const fromCell = selectedPiece.parentElement;

            if (toCell !== fromCell && isValidMove(selectedPiece, fromCell, toCell)) {
                // Verificar si el movimiento pone al propio rey en jaque
                const originalPiece = toCell.innerHTML;
                toCell.innerHTML = "";
                toCell.appendChild(selectedPiece);
                if (isKingInCheck(currentTurn)) {
                    alert("Movimiento inválido: ¡Tu rey estaría en jaque!");
                    fromCell.appendChild(selectedPiece);
                    toCell.innerHTML = originalPiece;
                    return;
                }

                // Promoción del peón
                if (selectedPiece.alt.includes("pawn") && (getRowCol(getIndex(toCell)).row === 0 || getRowCol(getIndex(toCell)).row === 7)) {
                    let newPiece = prompt("Promociona tu peón a (reina, torre, alfil, caballo):").toLowerCase();
                    const validPromotions = ["reina", "torre", "alfil", "caballo"];
                    while (!validPromotions.includes(newPiece)) {
                        newPiece = prompt("Opción inválida. Elige (reina, torre, alfil, caballo):").toLowerCase();
                    }
                    selectedPiece.alt = `${currentTurn}-${newPiece}`;
                    selectedPiece.src = `./img/${currentTurn}-${newPiece}.png`;
                }

                // Cambiar el turno
                currentTurn = currentTurn === "white" ? "black" : "white";
                turnDisplay.textContent = `Es turno del: ${currentTurn}`;
                enPassantTarget = null; // Resetear el objetivo de captura al paso
                checkmate();
            }
            selectedPiece = null; // Resetear la pieza seleccionada
        }
    }

    document.querySelectorAll(".item img").forEach(piece => {
        piece.draggable = true;
        piece.addEventListener("dragstart", handleDragStart);
    });

    cells.forEach(cell => {
        cell.addEventListener("dragover", handleDragOver);
        cell.addEventListener("drop", handleDrop);
    });
});