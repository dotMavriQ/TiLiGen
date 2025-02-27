import { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled, { createGlobalStyle } from 'styled-components';
import html2canvas from 'html2canvas';
import './App.css';

// Interface for item data
interface ItemData {
  id: string;
  imageUrl: string | null;
}

// Gruvbox Dark Theme Colors
const colors = {
  background: '#282828',
  foreground: '#ebdbb2',
  black: '#282828',
  red: '#cc241d',
  green: '#98971a',
  yellow: '#d79921',
  blue: '#458588',
  purple: '#b16286',
  aqua: '#689d6a',
  gray: '#a89984',
  darkgray: '#928374',
  brightred: '#fb4934',
  brightgreen: '#b8bb26',
  brightyellow: '#fabd2f',
  brightblue: '#83a598',
  brightpurple: '#d3869b',
  brightaqua: '#8ec07c',
  white: '#ebdbb2',
};

// Tier levels with labels and colors
const tierLevels = [
  { id: 'S', label: 'S', color: colors.brightred },
  { id: 'A', label: 'A', color: colors.brightyellow },
  { id: 'B', label: 'B', color: colors.brightgreen },
  { id: 'C', label: 'C', color: colors.brightblue },
  { id: 'D', label: 'D', color: colors.brightpurple },
  { id: 'F', label: 'F', color: colors.brightaqua },
];

// Global styles
const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${colors.background};
    color: ${colors.foreground};
    font-family: 'Fira Sans', sans-serif;
    margin: 0;
    padding: 0;
  }
`;

// Styled Components
const AppContainer = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: ${colors.brightaqua};
  }
`;

const TierGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 2rem;
  border: 2px solid ${colors.gray};
  border-radius: 6px;
  overflow: hidden;
`;

const TierRow = styled.div<{ color: string }>`
  display: flex;
  min-height: 80px;
  background-color: ${colors.black};
  border-bottom: 1px solid ${colors.darkgray};

  &:last-child {
    border-bottom: none;
  }
`;

const TierLabel = styled.div<{ color: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  min-width: 80px;
  font-size: 2rem;
  font-weight: bold;
  background-color: ${props => props.color};
  color: ${colors.black};
`;

const TierContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  min-height: 80px;
  background-color: rgba(40, 40, 40, 0.4);
`;

const ItemsPool = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 1rem;
  min-height: 120px;
  border: 2px dashed ${colors.gray};
  border-radius: 6px;
  margin-bottom: 2rem;
  background-color: rgba(40, 40, 40, 0.2);
`;

const Item = styled.div<{ hasImage: boolean }>`
  width: 70px;
  height: 70px;
  background-color: ${props => props.hasImage ? 'transparent' : colors.foreground};
  color: ${props => props.hasImage ? 'transparent' : colors.black};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  font-weight: bold;
  user-select: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  cursor: grab;
  background-size: cover;
  background-position: center;
  position: relative;
  border: ${props => props.hasImage ? `1px solid ${colors.darkgray}` : 'none'};
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background-color: ${colors.blue};
  color: ${colors.foreground};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${colors.brightblue};
  }
`;

// Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${colors.background};
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
`;

const ModalTitle = styled.h3`
  color: ${colors.brightaqua};
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  background-color: ${colors.black};
  color: ${colors.foreground};
  padding: 0.75rem;
  border: 1px solid ${colors.darkgray};
  border-radius: 4px;
  font-size: 1rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${colors.brightblue};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const ModalButton = styled.button<{ isPrimary?: boolean }>`
  background-color: ${props => props.isPrimary ? colors.green : colors.red};
  color: ${colors.foreground};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.isPrimary ? colors.brightgreen : colors.brightred};
  }
`;

// DOM to image function
const exportAsImage = async (element: HTMLElement, fileName: string) => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: colors.background,
      scale: 2,
    });
    
    // Download the image
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = fileName;
    link.href = image;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
    alert('Failed to export image. Make sure all images are loaded correctly.');
  }
};

function App() {
  // Store items with their data
  const [itemsData, setItemsData] = useState<{ [id: string]: ItemData }>(() => {
    const initialItems: { [id: string]: ItemData } = {};
    // Create 10 initial items
    for (let i = 1; i <= 10; i++) {
      const id = `item-${i}`;
      initialItems[id] = { id, imageUrl: null };
    }
    return initialItems;
  });

  // Store item positions
  const [items, setItems] = useState<{ [key: string]: string[] }>({
    pool: Array.from({ length: 10 }, (_, i) => `item-${i + 1}`),
    ...Object.fromEntries(tierLevels.map(tier => [tier.id, []]))
  });

  // State for the image URL modal
  const [modalOpen, setModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  // Ref for input field focus
  const inputRef = useRef<HTMLInputElement>(null);

  const addNewItem = () => {
    const newItemId = `item-${Date.now()}`;
    setItemsData(prev => ({
      ...prev,
      [newItemId]: { id: newItemId, imageUrl: null }
    }));
    setItems({
      ...items,
      pool: [...items.pool, newItemId]
    });
  };

  const clearAllItems = () => {
    // Get initial item IDs (the first 10 numbered items)
    const initialItemIds = Array.from({ length: 10 }, (_, i) => `item-${i + 1}`);
    
    // Create fresh item data (keep images for initial items, clear everything else)
    const resetItemsData: { [id: string]: ItemData } = {};
    initialItemIds.forEach(id => {
      resetItemsData[id] = { 
        id, 
        imageUrl: itemsData[id]?.imageUrl || null 
      };
    });
    
    // Reset item data to only include the initial items
    setItemsData(resetItemsData);
    
    // Reset positions - move all items back to pool
    setItems({
      pool: initialItemIds,
      ...Object.fromEntries(tierLevels.map(tier => [tier.id, []]))
    });
  };

  const handleItemClick = (id: string) => {
    // Don't trigger during drag
    if (isDragging) return;
    
    setActiveItemId(id);
    setImageUrl(itemsData[id]?.imageUrl || '');
    setModalOpen(true);
    
    // Focus the input field when modal opens
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleSaveImage = () => {
    if (activeItemId) {
      setItemsData(prev => ({
        ...prev,
        [activeItemId]: {
          ...prev[activeItemId],
          imageUrl: imageUrl.trim() || null
        }
      }));
    }
    setModalOpen(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveItemId(null);
    setImageUrl('');
  };
  
  // Save the current state to localStorage
  const saveState = () => {
    try {
      const state = {
        items,
        itemsData
      };
      localStorage.setItem('tierlist-save', JSON.stringify(state));
      alert('Tier list saved successfully!');
    } catch (error) {
      console.error('Failed to save tier list:', error);
      alert('Failed to save tier list');
    }
  };
  
  // Load state from localStorage
  const loadState = () => {
    try {
      const savedState = localStorage.getItem('tierlist-save');
      if (savedState) {
        const state = JSON.parse(savedState);
        setItems(state.items);
        setItemsData(state.itemsData);
        alert('Tier list loaded successfully!');
      } else {
        alert('No saved tier list found');
      }
    } catch (error) {
      console.error('Failed to load tier list:', error);
      alert('Failed to load tier list');
    }
  };

  // Track if we're currently dragging
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref for the tier grid to export as image
  const tierGridRef = useRef<HTMLDivElement>(null);
  
  // Export the tier list as an image
  const exportImage = () => {
    if (tierGridRef.current) {
      exportAsImage(tierGridRef.current, 'tierlist.png');
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: any) => {
    setIsDragging(false);
    
    const { source, destination } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Get source and destination lists
    const sourceList = [...items[source.droppableId]];
    const destList = source.droppableId === destination.droppableId
      ? sourceList
      : [...items[destination.droppableId]];
    
    // Remove item from source list
    const [removed] = sourceList.splice(source.index, 1);
    
    // Add item to destination list
    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, removed);
      
      setItems({
        ...items,
        [source.droppableId]: sourceList
      });
    } else {
      destList.splice(destination.index, 0, removed);
      
      setItems({
        ...items,
        [source.droppableId]: sourceList,
        [destination.droppableId]: destList
      });
    }
  };

  // Function to render an item
  const renderItem = (id: string, provided: any) => {
    const itemData = itemsData[id];
    const hasImage = !!itemData?.imageUrl;
    const backgroundImage = hasImage ? `url(${itemData.imageUrl})` : 'none';
    
    return (
      <Item
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onClick={() => handleItemClick(id)}
        hasImage={hasImage}
        style={{
          ...provided.draggableProps.style,
          backgroundImage
        }}
      >
        {!hasImage && id.split('-')[1]}
      </Item>
    );
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <h1>Gruvbox Tier List</h1>
        </Header>
        
        <Controls>
          <Button onClick={addNewItem}>Add Item</Button>
          <Button onClick={clearAllItems}>Reset</Button>
          <Button onClick={saveState} style={{ backgroundColor: colors.green }}>Save</Button>
          <Button onClick={loadState} style={{ backgroundColor: colors.yellow, color: colors.black }}>Load</Button>
          <Button onClick={exportImage} style={{ backgroundColor: colors.purple }}>Export Image</Button>
        </Controls>
        
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <h2>Items Pool</h2>
          <Droppable droppableId="pool" direction="horizontal">
            {(provided) => (
              <ItemsPool
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {items.pool.map((id, index) => (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(provided) => renderItem(id, provided)}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ItemsPool>
            )}
          </Droppable>
          
          <h2>Tier Grid</h2>
          <TierGrid ref={tierGridRef}>
            {tierLevels.map((tier) => (
              <TierRow key={tier.id} color={tier.color}>
                <TierLabel color={tier.color}>{tier.label}</TierLabel>
                <Droppable droppableId={tier.id} direction="horizontal">
                  {(provided) => (
                    <TierContent
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {items[tier.id].map((id, index) => (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(provided) => renderItem(id, provided)}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TierContent>
                  )}
                </Droppable>
              </TierRow>
            ))}
          </TierGrid>
        </DragDropContext>
      </AppContainer>

      {/* Image URL Modal */}
      {modalOpen && (
        <ModalOverlay 
          onClick={closeModal}
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
        >
          <ModalContent 
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape') closeModal();
              if (e.key === 'Enter') handleSaveImage();
            }}
          >
            <ModalTitle id="modal-title">Set Item Image</ModalTitle>
            <ModalForm>
              <label htmlFor="imageUrl">Image URL:</label>
              <Input
                ref={inputRef}
                type="text"
                id="imageUrl"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveImage();
                  }
                }}
              />
              {imageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '150px', 
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                      borderRadius: '4px',
                      border: `1px solid ${colors.darkgray}`
                    }} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23fb4934" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
                      target.style.padding = '20px';
                      target.style.backgroundColor = colors.background;
                    }}
                  />
                </div>
              )}
            </ModalForm>
            <ModalActions>
              <ModalButton onClick={closeModal}>Cancel</ModalButton>
              <ModalButton isPrimary onClick={handleSaveImage}>Place</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}

export default App;