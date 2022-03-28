import React, { useState, useEffect, useRef } from 'react'
import { Container, Draggable } from 'react-smooth-dnd'
import { Container as BootstrapContainer, Row, Col, Form, Button } from 'react-bootstrap'
import {isEmpty, cloneDeep} from 'lodash'

import './BoardContent.scss'
import Column from 'components/Column/Column'
import {mapOrder} from 'utilities/sorts'
import {applyDrag} from 'utilities/dragDrop'
import { 
    fetBoardDetails, 
    createNewColumn, 
    updateBoard, 
    updateColumn, 
    updateCard  } from 'actions/ApiCall'

function BoardContent(){
    const [board, setBoard] = useState({})
    const [columns, setColumns] = useState([])
    const [openNewColumnForm, setOpenNewColumnForm] = useState(false)
    const toggeleOpenNewColumnForm = () => { setOpenNewColumnForm(!openNewColumnForm)}

    const [newColumnTitle, setNewColumnTitle] = useState('')
    const onNewColumnTitleChange = (e) => setNewColumnTitle(e.target.value)
    

    const newColumnInputRef= useRef(null)

    useEffect(() => {
        const boardId = '623dad30468af752957ecf69'
        fetBoardDetails(boardId).then(board => {
            console.log(board)
            setBoard(board)
            setColumns(mapOrder(board.columns, board.columnOrder, '_id'))
        })
    }, [])

    useEffect(() => {
        if (newColumnInputRef && newColumnInputRef.current){
            newColumnInputRef.current.focus()
            newColumnInputRef.current.select()
        }
        
    }, [openNewColumnForm])

    if(isEmpty(board)){
        return <div className="not-found" style={{ 'padding':'10px', 'color':'white' }}>Board not found!</div>
    }

    const onColumnDrop = (dropResult) =>{
        console.log(dropResult)
        let newColumns = cloneDeep(columns)
        newColumns = applyDrag(newColumns, dropResult)
        
        let newBoard = cloneDeep(board)
        newBoard.columnOrder = newColumns.map(c => c._id)
        newBoard.columns = newColumns

        setColumns(newColumns)
        setBoard(newColumns)

        //call api update columnOrder in board
        updateBoard(newBoard._id, newBoard).then(updateBoard => {
            setColumns(newColumns)
            setBoard(updateBoard)
        })

        updateBoard(newBoard._id, newBoard).catch(() => {
            setColumns(columns)
            setBoard(board)
        })
        
    }

    const onCardDrop = (columnId, dropResult) => {
        if (dropResult.removedIndex !== null || dropResult.addedIndex !== null){
            let newColumns = cloneDeep(columns)
            
            let currentColumn = newColumns.find(c => c._id === columnId)
            currentColumn.cards = applyDrag(currentColumn.cards, dropResult)
            currentColumn.cardOrder = currentColumn.cards.map( i => i._id)
            
            // console.log(dropResult)
            setColumns(newColumns)
            if(dropResult.removedIndex !== null && dropResult.addedIndex !== null){
                // action move card inside its card
                // call api update cardOrder in current column
                updateColumn(currentColumn._id, currentColumn).catch(() =>{
                    setColumns(columns)
                })

            }else{
                // action move card between two column
                // call api update cardOrder in curren column
                
                updateColumn(currentColumn._id, currentColumn).catch(() =>{
                    setColumns(columns)
                })
                if(dropResult.addedIndex !== null){
                    let currentCard = cloneDeep(dropResult.payload)
                    currentCard.columnId = currentColumn._id
                   // call api update columnIn in current column
                   updateCard(currentCard._id, currentCard)

                }
                
            }
            
        }
        
    }


    const addNewColumn = () =>{
        if(!newColumnTitle) {
            newColumnInputRef.current.focus()
            return
        }
        const newColumnToAdd ={
            boardId:board._id,
            title: newColumnTitle.trim()
        }

        createNewColumn(newColumnToAdd).then(column => {
            console.log(column)
            let newColumns=[...columns]
            newColumns.push(column)
            
            let newBoard = { ...board }
            newBoard.columnOrder = newColumns.map(c => c._id)
            newBoard.columns = newColumns

            setColumns(newColumns)
            setBoard(newBoard)
            setNewColumnTitle('')
            toggeleOpenNewColumnForm()
        })

        

    }
    const onUpdateColumnState = (newColumnToUpdate) => {
        const columnIdToUpdate = newColumnToUpdate._id

        let newColumns = [...columns]
        const columnIndexToUpdate = newColumns.findIndex(i => i._id === columnIdToUpdate)

        if (newColumnToUpdate._destroyed){
            //remove column
            newColumns.splice(columnIndexToUpdate, 1)
        } else {
            // update column info
            newColumns.splice(columnIndexToUpdate, 1, newColumnToUpdate)
        }

        let newBoard = { ...board }
        newBoard.columnOrder = newColumns.map(c => c._id)
        newBoard.columns = newColumns

        setColumns(newColumns)
        setBoard(newBoard)
    }



    return(
        <div className="board-content">
        <Container
          orientation="horizontal"
          onDrop={onColumnDrop}
          getChildPayload={index => columns[index]
          }
          dragHandleSelector=".column-drag-handle"
          dropPlaceholder={{
            animationDuration: 150,
            showOnTop: true,
            className: 'column-drop-preview'
          }}
        >
            {columns.map((column, index) => (
                <Draggable key={index}>
                <Column  
                    column={column} 
                    onCardDrop = {onCardDrop} 
                    onUpdateColumnState={onUpdateColumnState}
                />
                </Draggable>
            ))}
            </Container>

            <BootstrapContainer className="trello-container">
                {!openNewColumnForm && 
                
                    <Row>
                        <Col className = "add-new-column" onClick={toggeleOpenNewColumnForm}>
                            <i className="fa fa-plus icon" /> Add another column
                        </Col>
                    </Row>
                }

                {openNewColumnForm && 
                
                <Row>
                    <Col className = "enter-new-column">
                        <Form.Control
                            size="sm" 
                            type="text" 
                            placeholder="Enter column title ..." 
                            className="input-enter-new-column"
                            ref={newColumnInputRef}
                            value={newColumnTitle}
                            onChange={onNewColumnTitleChange}
                            onKeyDown={event => (event.key==='Enter') && addNewColumn()}
                        />
                        <Button variant="success" size = "sm" onClick = {addNewColumn}>Add column</Button>
                        <span className="cancel-icon"><i className="fa fa-trash icon" onClick={toggeleOpenNewColumnForm} /></span>
                    </Col>
                </Row>
            }               
                
            </BootstrapContainer>
            
        </div>
        )

}

export default BoardContent