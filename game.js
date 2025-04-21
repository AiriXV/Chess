document.addEventListener("DOMContentLoaded", () => {
    let selectedPiece = null;
    let currentTurn = "white";
    let enPassantTarget = null;
    const turnDisplay = document.querySelector("h2");

    function isPathClear(fromIndex, toIndex, step) {
        const cells = document.querySelectorAll(".item");
        let i = fromIndex + step;
        while (i !== toIndex) {
            if (cells[i].firstChild) return false;
            i += step;
        }
        return true;
    }

    function isValidMove(piece, fromCell, toCell) {
        const pieceType = piece.alt.split("-")[1];
        const pieceColor = piece.alt.split("-")[0];
        const toPiece = toCell.firstChild;
        if (toPiece && toPiece.alt.split("-")[0] === pieceColor) return false;

        const fromIndex = Array.from(fromCell.parentNode.children).indexOf(fromCell);
        const toIndex = Array.from(toCell.parentNode.children).indexOf(toCell);
        const rowDiff = Math.floor(toIndex / 8) - Math.floor(fromIndex / 8);
        const colDiff = (toIndex % 8) - (fromIndex % 8);
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        switch (pieceType) {
            case "pawn": {
                const direction = pieceColor === "white" ? -1 : 1;
                const startRow = pieceColor === "white" ? 6 : 1;
                const fromRow = Math.floor(fromIndex / 8);

                if (colDiff === 0) {
                    if (rowDiff === direction && !toPiece) return true;
                    if (rowDiff === 2 * direction && fromRow === startRow && !toPiece && !document.querySelectorAll(".item")[fromIndex + direction * 8].firstChild) {
                        enPassantTarget = document.querySelectorAll(".item")[fromIndex + direction * 8];
                        return true;
                    }
                }
                if (absColDiff === 1 && rowDiff === direction && (toPiece || (enPassantTarget === toCell))) {
                    if (enPassantTarget === toCell && !toPiece) {
                        const capturedPawnIndex = toIndex + (pieceColor === "white" ? 8 : -8);
                        document.querySelectorAll(".item")[capturedPawnIndex].innerHTML = "";
                    }
                    return true;
                }
                break;
            }
            case "rook": {
                if (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) return true;
                if (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1)) return true;
                break;
            }
            case "horse": {
                if (toPiece && toPiece.alt.split("-")[0] === pieceColor) return false;
                if ((absColDiff === 2 && absRowDiff === 1) || (absColDiff === 1 && absRowDiff === 2)) return true;
                break;
            }
            case "bishop": {
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, (rowDiff > 0 ? 8 : -8) + (colDiff > 0 ? 1 : -1))) return true;
                break;
            }
            case "queen": {
                if ((absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, (rowDiff > 0 ? 8 : -8) + (colDiff > 0 ? 1 : -1))) ||
                    (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) ||
                    (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1))) return true;
                break;
            }
            case "king": {
                if (toPiece && toPiece.alt.split("-")[0] === pieceColor) return false;
                if (absRowDiff <= 1 && absColDiff <= 1) return true;
                break;
            }
        }
        return false;
    }

    function isKingInCheck(color) {
        const king = document.querySelector(`img[alt='${color}-king']`).parentElement;
        return Array.from(document.querySelectorAll(".item img"))
            .filter(img => !img.alt.includes(color))
            .some(enemy => isValidMove(enemy, enemy.parentElement, king));
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
                    const capturedPiece = cell.firstChild;
                    cell.innerHTML = "";
                    cell.appendChild(selectedPiece);
                    if (isKingInCheck(currentTurn)) {
                        alert("Movimiento inválido, el rey queda en jaque.");
                        previousParent.appendChild(selectedPiece);
                        if (capturedPiece) cell.appendChild(capturedPiece);
                        return;
                    }
                    const targetRow = Math.floor(Array.from(cell.parentNode.children).indexOf(cell) / 8);
                    if (selectedPiece.alt.includes("pawn") && (targetRow === 0 || targetRow === 7)) {
                        let newPiece = "queen";
                        while (!["queen", "rook", "bishop", "horse"].includes(newPiece)) {
                            newPiece = prompt("Promoción de peón: elige reina, torre, alfil o caballo").toLowerCase();
                        }
                        selectedPiece.alt = `${currentTurn}-${newPiece}`;
                        selectedPiece.src = `img/${currentTurn}-${newPiece}.png`;
                    }
                    currentTurn = currentTurn === "white" ? "black" : "white";
                    turnDisplay.textContent = `Es turno del: ${currentTurn}`;
                    checkmate();
                }
            }
        });
    });
});
