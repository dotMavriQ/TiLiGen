import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import styled, { createGlobalStyle } from 'styled-components';
import html2canvas from 'html2canvas';
import './App.css';

// Fix for React 18 StrictMode and react-beautiful-dnd
// See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
const ReactBDFixes = () => {
  useEffect(() => {
    // Monkey patching
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Warning: forwardRef render functions do not support propTypes or defaultProps')
      ) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return null;
};

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
  /* Remove gap between rows */
  margin-bottom: 2rem;
  border: 2px solid ${colors.gray};
  border-radius: 6px;
  overflow: hidden;
`;

const TierRow = styled.div<{ color: string }>`
  display: flex;
  min-height: 85px;
  background-color: ${colors.black};
  border-bottom: 2px solid ${colors.darkgray};
  position: relative;

  &:before {
    content: '';
    position: absolute;
    left: 80px; /* Width of tier label */
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: ${colors.darkgray};
    opacity: 0.5;
  }

  &:first-child {
    .tier-separator {
      display: none;
    }
  }

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
  align-items: center;
`;

const ItemsPool = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 1rem;
  min-height: 120px;
  border: 2px dashed ${colors.gray};
  border-radius: 6px;
  margin-bottom: 2rem;
  background-color: rgba(40, 40, 40, 0.2);
  align-items: center;
  justify-content: flex-start;
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
  position: relative;
  border: ${props => props.hasImage ? `1px solid ${colors.darkgray}` : 'none'};
  transition: transform 0.2s, box-shadow 0.2s;
  margin: 2px;
  flex-shrink: 0;
  overflow: hidden; /* Ensure images don't overflow */
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    cursor: grabbing;
  }
  
  /* Control buttons that appear on hover */
  .item-controls {
    position: absolute;
    top: -20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    z-index: 5;
  }
  
  &:hover .item-controls {
    opacity: 1;
    pointer-events: auto;
  }
  
  /* Make sure exported images don't have the controls */
  @media print {
    .item-controls {
      display: none !important;
    }
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

// DOM to image function - simpler approach that bypasses image preloading issues
const exportAsImage = async (element: HTMLElement, fileName: string) => {
  // Create a loading indicator
  const loadingEl = document.createElement('div');
  loadingEl.style.position = 'fixed';
  loadingEl.style.top = '50%';
  loadingEl.style.left = '50%';
  loadingEl.style.transform = 'translate(-50%, -50%)';
  loadingEl.style.padding = '20px';
  loadingEl.style.backgroundColor = colors.background;
  loadingEl.style.color = colors.foreground;
  loadingEl.style.borderRadius = '8px';
  loadingEl.style.zIndex = '10000';
  loadingEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  loadingEl.style.border = `1px solid ${colors.darkgray}`;
  loadingEl.textContent = 'Preparing to export...';
  document.body.appendChild(loadingEl);

  try {
    // Give the browser a moment to render the loading indicator
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // First approach: Try using html2canvas directly
    loadingEl.textContent = 'Exporting tier list...';
    
    const canvas = await html2canvas(element, {
      backgroundColor: colors.background,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false, // Try with this disabled first
      logging: true,
      ignoreElements: (el) => {
        // Ignore elements with 'item-controls' class
        return el.classList.contains('item-controls');
      }
    });
    
    // Download the image
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = fileName;
    link.href = image;
    link.click();
    
    // Success!
    loadingEl.textContent = 'Export complete!';
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Error exporting image:', error);
    loadingEl.textContent = 'Error exporting image. Trying backup method...';
    
    try {
      // Backup method: Take a direct screenshot approach
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a clone of the element to capture
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      document.body.appendChild(clone);
      
      // Remove any interactive elements that might cause issues
      const controls = clone.querySelectorAll('.item-controls');
      controls.forEach(control => control.remove());
      
      // Try again with the clone
      const canvas = await html2canvas(clone, {
        backgroundColor: colors.background,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      // Download the image
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = image;
      link.click();
      
      document.body.removeChild(clone);
      
      // Success with backup method
      loadingEl.textContent = 'Export complete!';
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (backupError) {
      console.error('Backup export failed:', backupError);
      loadingEl.textContent = 'Sorry, export failed. Try taking a screenshot instead.';
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } finally {
    // Always remove the loading element
    if (document.body.contains(loadingEl)) {
      document.body.removeChild(loadingEl);
    }
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
    // Find the highest existing item number
    let highestNumber = 0;
    Object.keys(itemsData).forEach(id => {
      const parts = id.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1]);
        if (!isNaN(num) && num > highestNumber) {
          highestNumber = num;
        }
      }
    });
    
    // Create new item with sequential number
    const nextNumber = highestNumber + 1;
    const newItemId = `item-${nextNumber}`;
    
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
      // If moving within the same list, maintain the original order with the item moved
      sourceList.splice(destination.index, 0, removed);
      
      setItems({
        ...items,
        [source.droppableId]: sourceList
      });
    } else {
      // If moving to a different list, place the item in the destination list
      // at the specified index to maintain left-to-right ordering
      destList.splice(destination.index, 0, removed);
      
      // Play a subtle locking sound when item is placed in a tier
      if (destination.droppableId !== 'pool') {
        try {
          // Create a quick "snap" sound
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (err) {
          // Ignore audio errors
        }
      }
      
      // Set the snapped item for animation
      setSnappedItemId(removed);
      
      setItems({
        ...items,
        [source.droppableId]: sourceList,
        [destination.droppableId]: destList
      });
    }
  };

  // Track snapped items for animation
  const [snappedItemId, setSnappedItemId] = useState<string | null>(null);
  
  // Add fallback method for moving items between tiers
  const moveItemToTier = (itemId: string, destTier: string) => {
    // Find the current location of the item
    let sourceList = '';
    Object.entries(items).forEach(([listId, itemIds]) => {
      if (itemIds.includes(itemId)) {
        sourceList = listId;
      }
    });
    
    if (!sourceList) return;
    
    // Don't do anything if already in the target tier
    if (sourceList === destTier) return;
    
    // Update the lists
    const updatedItems = { ...items };
    
    // Remove from source
    updatedItems[sourceList] = updatedItems[sourceList].filter(id => id !== itemId);
    
    // Add to destination
    updatedItems[destTier] = [...updatedItems[destTier], itemId];
    
    // Update state
    setItems(updatedItems);
    
    // Set snapped for animation
    setSnappedItemId(itemId);
  };
  
  // Small control button for manual item movement
  const ItemControlButton = styled.button`
    background-color: ${colors.background};
    color: ${colors.foreground};
    border: 1px solid ${colors.darkgray};
    border-radius: 4px;
    width: 24px;
    height: 24px;
    font-size: 12px;
    margin: 0 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background-color: ${colors.blue};
    }
  `;
  
  // Function to render an item
  const renderItem = (id: string, provided: any, snapshot: any) => {
    const itemData = itemsData[id];
    const hasImage = !!itemData?.imageUrl;
    
    // Add animation class if this item was just dropped
    const isSnapped = id === snappedItemId;
    
    // Clear snapped state after animation
    if (isSnapped) {
      setTimeout(() => setSnappedItemId(null), 300);
    }
    
    // Render manual tier selection dropdown
    const renderTierDropdown = () => {
      return (
        <div className="item-manual-move">
          <select 
            onChange={(e) => {
              const selectedTier = e.target.value;
              if (selectedTier) {
                moveItemToTier(id, selectedTier);
                // Reset dropdown after use
                e.target.value = '';
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.background,
              color: colors.foreground,
              border: `1px solid ${colors.darkgray}`,
              borderRadius: '4px',
              padding: '2px',
              fontSize: '12px'
            }}
          >
            <option value="">Move to...</option>
            <option value="pool">Pool</option>
            {tierLevels.map(tier => (
              <option key={tier.id} value={tier.id}>Tier {tier.label}</option>
            ))}
          </select>
        </div>
      );
    };
    
    return (
      <Item
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        onClick={() => handleItemClick(id)}
        hasImage={hasImage}
        className={isSnapped ? 'item-snapped' : ''}
        style={{
          ...provided.draggableProps.style,
          boxShadow: snapshot.isDragging 
            ? '0 5px 15px rgba(0, 0, 0, 0.3)' 
            : '0 2px 5px rgba(0, 0, 0, 0.2)',
          cursor: snapshot.isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        {hasImage ? (
          // Using an actual img element instead of background-image for better export compatibility
          <img 
            src={itemData.imageUrl || ''}
            alt=""
            style={{
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              borderRadius: '4px',
              display: 'block'
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div style={{ 
            fontSize: id.split('-')[1].length > 2 ? '14px' : '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            {id.split('-')[1]}
          </div>
        )}
        
        {/* Manual controls for positioning (in case drag and drop doesn't work) */}
        <div className="item-controls">
          {renderTierDropdown()}
        </div>
      </Item>
    );
  };

  return (
    <>
      <ReactBDFixes />
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
        
        <div style={{ 
          marginBottom: '1rem', 
          padding: '8px', 
          backgroundColor: colors.black, 
          borderRadius: '4px',
          border: `1px solid ${colors.yellow}`,
          fontSize: '0.9rem'
        }}>
          <strong style={{ color: colors.brightyellow }}>Tip:</strong> If drag and drop isn't working, hover over any item and use the dropdown menu to move it between tiers.
        </div>
        
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
                    {(provided, snapshot) => renderItem(id, provided, snapshot)}
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
                          {(provided, snapshot) => renderItem(id, provided, snapshot)}
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