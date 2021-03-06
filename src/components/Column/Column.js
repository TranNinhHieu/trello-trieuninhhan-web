import React, {useState, useEffect, useRef} from 'react'
import { Container, Draggable } from 'react-smooth-dnd'
import {Dropdown, Form, Button} from 'react-bootstrap'
import {cloneDeep} from 'lodash'

import './Column.scss'
import Card from 'components/Card/Card'
import ConfirmModal from 'components/Common/ConfirmModal'
import {MODAL_ACTION_COFIRM} from 'utilities/constants'
import {saveContentAfterPressEnter, selectAllInlineText} from 'utilities/contentEditable'
import {mapOrder} from 'utilities/sorts'
import { createNewCard, updateColumn } from 'actions/ApiCall'
function Column(props){
  const { column, onCardDrop, onUpdateColumnState } = props
  const cards = mapOrder(column.cards,column.cardOrder,'_id')

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const toggleShowConfirmModal = () => setShowConfirmModal(!showConfirmModal)

  const [columnTitle, setColumnTitle] = useState('')
  const handleColumnTitleChange = (e)=> setColumnTitle(e.target.value)

  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggeleOpenNewCardForm = () => { setOpenNewCardForm(!openNewCardForm)}

  const newCardTextareaRef = useRef(null)

  const [newCardTitle, setNewCardTitle] = useState('')
  const onNewCardTitleChange = (e) => setNewCardTitle(e.target.value)

  useEffect(() => {
    setColumnTitle(column.title)
  }, [column.title])

  useEffect(() => {
    if (newCardTextareaRef && newCardTextareaRef.current){
        newCardTextareaRef.current.focus()
        newCardTextareaRef.current.select()
    }
    
    }, [openNewCardForm])

    //rm column
  const onConfirmModalAction = (type) => {
    
    if(type === MODAL_ACTION_COFIRM) {
      const newColumn ={
        ...column,
        _destroyed: true
      }     
      // call api update column    
      updateColumn(newColumn._id, newColumn).then(updatedColumn => { 
        onUpdateColumnState(updatedColumn)
      }) 
    }
    toggleShowConfirmModal()
  }

  //update column title
  const handleColumnTitleBlur = () => {

    console.log(column.title)
    console.log(columnTitle)
    if(columnTitle!==column.title){
      const newColumn ={
        ...column,
        title: columnTitle
      }  
      // call api update column    
      updateColumn(newColumn._id, newColumn).then(updatedColumn => { 
        onUpdateColumnState(updatedColumn)
      })
    }
    
    
  }

  const addNewCard = () =>{
    if(!newCardTitle) {
      newCardTextareaRef.current.focus()
      return
    }

    const newCardToAdd ={
      boardId:column.boardId,
      columnId:column._id,
      title: newCardTitle.trim()
    } 
    //call api
    createNewCard(newCardToAdd).then(card => {
      let newColumn={...cloneDeep(column)}
      newColumn.cards.push(card)
      newColumn.cardOrder.push(card._id)
      
      onUpdateColumnState(newColumn)
      setNewCardTitle('')
      toggeleOpenNewCardForm()
      })

  }

  return(
      <div className="column">
        <header className="column-drag-handle">
          <div className="column-title">
            <Form.Control
                size="sm" 
                type="text" 
                className="trieuninhhan-content-editable"
                value={columnTitle}
                onChange={handleColumnTitleChange}
                onBlur={handleColumnTitleBlur}
                onClick={selectAllInlineText}
                onMouseDown={e => e.preventDefault()}
                onKeyDown={saveContentAfterPressEnter}
                spellCheck="false"
                
            />
          </div>
          <div className="column-dropdown-actions">
            <Dropdown>
              <Dropdown.Toggle  id="dropdown-basic" size ="sm" className="dropdown-btn" />

              <Dropdown.Menu>
                <Dropdown.Item onClick={toggeleOpenNewCardForm}>Add card ...</Dropdown.Item>
                <Dropdown.Item onClick={toggleShowConfirmModal}>Remove column ...</Dropdown.Item>
                <Dropdown.Item >Move all card in this column (beta)</Dropdown.Item>
                <Dropdown.Item >Archive all card in this column (beta)</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          
        </header>
      <div className="card-list">
        <Container
          groupName='trieuninhhan-columns'
          onDrop={dropResult => onCardDrop(column._id, dropResult)}
          getChildPayload={index => cards[index]}
          dragClass='card-ghost'
          dropClass='card-ghost-drop'
          
          dropPlaceholder={{                      
            animationDuration: 150,
            showOnTop: true,
            className: 'card-drop-preview' 
          }}
          dropPlaceholderAnimationDuration={200}
        > 
          {cards.map((card, index) => (
            <Draggable key={index}>
              <Card card={card} />
            </Draggable>
            
          ) )}
        </Container>
        {openNewCardForm && 
          <div className="add-new-card-area">
            <Form.Control
                size="sm" 
                as="textarea" 
                rows="3"
                placeholder="Enter card title ..." 
                className="textarea-enter-new-card"
                ref={newCardTextareaRef}
                value={newCardTitle}
                onChange={onNewCardTitleChange}
                onKeyDown={event => (event.key==='Enter') && addNewCard()}
            />
          </div>
        }
        
      </div>
      <footer>
        {openNewCardForm && 
            <div className="add-new-card-actions">
              <Button variant="success" size = "sm" onClick={addNewCard} >Add card</Button>
              <span className="cancel-icon"><i className="fa fa-trash icon"  onClick={toggeleOpenNewCardForm}/></span>
            </div>
        }

        { !openNewCardForm && 
          <div className="footer-actions" onClick={toggeleOpenNewCardForm}>
            <i className="fa fa-plus icon" /> Add another card
          </div>
        }
        
      </footer>
      <ConfirmModal 
        show={showConfirmModal}
        onAction={onConfirmModalAction}
        title="Remove Column"
        content={`Are you sure you want to remove <strong>${column.title}</strong>.<br/>! All relative cards will be removed`}
      />
    </div>
  )

}

export default Column