import React, { useState, useEffect } from 'react'
import './App.css'
import colorsData from './assets/colors.json'
import { Circle } from 'lucide-react';

const HiddenCircle = () => {
  return (
    <div className='circle invisible flex items-center justify-center w-[60px] h-[60px]'>    </div>
  )
}

const BoardPaintSlot = ({ paint, onClick, onRightClick, quantity, cartQty }) => {
  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onRightClick(); }}
      className='circle cursor-pointer relative group flex items-center justify-center'
    >
      <Circle
        size={55}
        strokeWidth={1}
        color="#000000"
        style={{ fill: paint ? paint.hex : 'transparent' }}
      />
      {paint && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className='text-[15px] font-bold text-white bg-black/50 px-1'>
              {paint.code}
            </p>
          </div>
          <div className="absolute -bottom-1 flex justify-center w-full pointer-events-none">
            <p className='text-[15px] font-bold text-white bg-black/50 px-1 whitespace-nowrap'>
              {quantity}
              {cartQty > 0 && <span className='text-green-400 ml-1'>(+{cartQty})</span>}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

const SearchCircle = ({ paint, onClick }) => {
  return (
    <div
      onClick={() => onClick(paint)}
      className='cursor-pointer flex items-center gap-2 hover:bg-slate-800 p-1 rounded min-w-0'
    >
      <Circle
        size={40}
        strokeWidth={1.5}
        color="#000000"
        style={{ fill: paint.hex }}
      />
      <span className='wrap text-sm'>{paint.name} {paint.code} </span>
    </div>
  );
}

const SelectedPaint = ({ paint, isNewSelection }) => {
  return (
    <div className='flex flex-col items-center justify-center p-2'>
      <div className='relative mb-4'>
        <Circle
          size={160}
          strokeWidth={1}
          color="#000000"
          style={{ fill: paint.hex }}
        />
        {isNewSelection && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className='text-4xl font-black text-white bg-black/50 px-4 py-1'>
              !
            </p>
          </div>
        )}
      </div>
      <div className='text-center'>
        <p className='text-xl font-black tracking-wider'>{paint.code}</p>
        <p className='text-sm text-slate-400 uppercase tracking-tight'>{paint.name}</p>
      </div>
    </div>
  );
}

function App() {
  const [selectedPaint, setSelectedPaint] = useState(null);
  const [isNewSelection, setIsNewSelection] = useState(false);

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('paint-inventory');
    return saved ? JSON.parse(saved) : {};
  });

  const [shoppingCart, setShoppingCart] = useState(() => {
    const saved = localStorage.getItem('paint-shopping-cart');
    return saved ? JSON.parse(saved) : {};
  });

  const [board, setBoard] = useState(() => {
    const saved = localStorage.getItem('paint-board');
    return saved ? JSON.parse(saved) : Array(105).fill(null);
  });

  const [customPaints, setCustomPaints] = useState(() => {
    const saved = localStorage.getItem('paint-custom-paints');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [newPaint, setNewPaint] = useState({ name: '', code: '', hex: '#ffffff' });

  useEffect(() => {
    localStorage.setItem('paint-inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('paint-shopping-cart', JSON.stringify(shoppingCart));
  }, [shoppingCart]);

  useEffect(() => {
    localStorage.setItem('paint-board', JSON.stringify(board));
  }, [board]);

  useEffect(() => {
    localStorage.setItem('paint-custom-paints', JSON.stringify(customPaints));
  }, [customPaints]);

  const allPaints = [...colorsData, ...customPaints]
    .filter((paint, index, self) =>
      self.findIndex(p => p.code === paint.code) === index
    );

  const filteredPaints = allPaints.filter(paint => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      paint.name.toLowerCase().includes(searchLower) ||
      paint.code.toLowerCase().includes(searchLower)
    );
  });

  const boardCodes = new Set(board.filter(p => p).map(p => p.code));

  const inventoryPaints = allPaints.filter(p =>
    (inventory[p.code]?.qty || 0) > 0 ||
    boardCodes.has(p.code) ||
    (shoppingCart[p.code]?.qty || 0) > 0
  );

  const nonIndexedPaints = inventoryPaints.filter(p => !boardCodes.has(p.code));

  const handleAddPaint = () => {
    if (!newPaint.name || !newPaint.code) return;
    setCustomPaints([...customPaints, newPaint]);
    setNewPaint({ name: '', code: '', hex: '#ffffff' });
    setSelectedPaint(newPaint);
    setIsNewSelection(true);
  };

  const updateInventory = (code, delta) => {
    setInventory(prev => ({
      ...prev,
      [code]: {
        qty: Math.max(0, (prev[code]?.qty || 0) + delta)
      }
    }));
  };

  const updateShoppingCart = (code, delta) => {
    setShoppingCart(prev => {
      const currentQty = prev[code]?.qty || 0;
      const newQty = Math.max(0, currentQty + delta);

      const newCart = { ...prev };

      if (newQty > 0) {
        newCart[code] = { qty: newQty };
      } else {
        delete newCart[code];
      }

      return newCart;
    });
  };

  const handleSlotClick = (index) => {
    const clickedPaint = board[index];

    if (clickedPaint && !isNewSelection) {
      setSelectedPaint(clickedPaint);
      setIsNewSelection(false);
      return;
    }

    if (selectedPaint && isNewSelection) {
      const newBoard = [...board];
      newBoard[index] = selectedPaint;
      setBoard(newBoard);
      setIsNewSelection(false);
    }
  };

  const handleSlotRightClick = (index) => {
    const newBoard = [...board];
    newBoard[index] = null;
    setBoard(newBoard);
  };

  const renderSlots = (count, startIndex) => {
    return Array.from({ length: count }, (_, i) => {
      const index = startIndex + i;
      const paint = board[index];
      return (
        <BoardPaintSlot
          key={index}
          paint={paint}
          quantity={paint ? inventory[paint.code]?.qty || 0 : 0}
          cartQty={paint ? shoppingCart[paint.code]?.qty || 0 : 0}
          onClick={() => handleSlotClick(index)}
          onRightClick={() => handleSlotRightClick(index)}
        />
      );
    });
  };

  const handleExport = (type) => {
    let lines = [];
    let fileName = '';

    if (type === 'inventory') {
      lines = inventoryPaints.map(p =>
        `${p.code} - ${p.name} - ${inventory[p.code]?.qty || 0}`
      );
      fileName = 'inventory.txt';
    } else if (type === 'non-indexed') {
      lines = nonIndexedPaints.map(p =>
        `${p.code} - ${p.name} - ${inventory[p.code]?.qty || 0}`
      );
      fileName = 'non-indexed.txt';
    } else if (type === 'cart') {
      lines = allPaints
        .filter(p => shoppingCart[p.code])
        .map(p => `${p.code} - ${p.name} - ${shoppingCart[p.code].qty}`);
      fileName = 'shopping-list.txt';
    }

    if (lines.length === 0) {
      alert('List is empty');
      return;
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className='flex flex-col h-screen bg-slate-900 text-white'>
        <div className='flex flex-1 overflow-hidden gap-4 p-4'>

          {/*Left Sidebar*/}
          <div className='w-1/4 flex flex-col wh-border-slate-400 border-2 rounded-2xl overflow-hidden bg-slate-900'>
            <div className='flex-1 flex flex-row gap-2 p-2 overflow-y-auto min-h-0'>
              {/*Full Inventory */}
              <div className='flex-1 flex flex-col min-w-0 border-r border-slate-700 pr-1'>
                <h3 className='border-b'>Inventory ({inventoryPaints.length})</h3>
                <div className='flex-1 overflow-y-auto flex flex-col gap-1 pr-1'>
                  {inventoryPaints.map(paint => {
                    const cartQty = shoppingCart[paint.code]?.qty || 0;
                    return (
                      <div
                        key={paint.code}
                        onClick={() => { setSelectedPaint(paint); setIsNewSelection(true); }}
                        className='flex items-center justify-between text-sm p-2 cursor-pointer hover:bg-slate-800 rounded'
                      >
                        <div className='flex items-center gap-2 overflow-hidden'>
                          <Circle size={16} fill={paint.hex} strokeWidth={1} />
                          <span className='truncate'>{paint.code}</span>
                        </div>
                        <span className='font-bold text-white'>
                          {inventory[paint.code]?.qty || 0}
                          {cartQty > 0 && <span className='text-green-400 ml-1'>(+{cartQty})</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Non Indexed */}
              <div className='flex-1 flex flex-col min-w-0 border-r border-slate-700 pr-1'>
                <h3 className='border-b'>Non-Indexed ({nonIndexedPaints.length})</h3>
                <div className='flex-1 overflow-y-auto flex flex-col gap-1 pr-1'>
                  {nonIndexedPaints.map(paint => {
                    const cartQty = shoppingCart[paint.code]?.qty || 0;
                    return (
                      <div
                        key={paint.code}
                        onClick={() => { setSelectedPaint(paint); setIsNewSelection(true); }}
                        className='flex items-center justify-between text-sm p-2 cursor-pointer hover:bg-slate-800 rounded'
                      >
                        <div className='flex items-center gap-2 overflow-hidden'>
                          <Circle size={16} fill={paint.hex} strokeWidth={1} />
                          <span className='truncate'>{paint.code}</span>
                        </div>
                        <span className='font-bold'>
                          {inventory[paint.code]?.qty || 0}
                          {cartQty > 0 && <span className='text-green-400 ml-1'>(+{cartQty})</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/*Shopping Cart*/}
              <div className='flex-1 flex flex-col min-w-0 border-slate-700 pr-1'>
                <h3 className='border-b'>Shopping cart</h3>
                <div className='flex-1 overflow-y-auto flex flex-col gap-1 pr-1'>
                  {allPaints.filter(p => shoppingCart[p.code]).map(paint => (
                    <div
                      key={paint.code}
                      onClick={() => { setSelectedPaint(paint); setIsNewSelection(true); }}
                      className='flex items-center justify-between text-sm p-2 cursor-pointer hover:bg-slate-800 rounded'
                    >
                      <div className='flex items-center gap-2 overflow-hidden'>
                        <Circle size={16} fill={paint.hex} strokeWidth={1} />
                        <span className='truncate'>{paint.code}</span>
                      </div>
                      <span className='font-bold'>{shoppingCart[paint.code]?.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/*Export buttons*/}
            <div className='p-2 justify-center border-t flex flex-row gap-2'>
              <button
                onClick={() => handleExport('inventory')}
                className='bg-blue-700 text-xs p-2 py-2 rounded hover:bg-blue-600 font-bold'>
                EXPORT INVENTORY
              </button>
              <button
                onClick={() => handleExport('non-indexed')}
                className='bg-blue-700 text-xs p-2 py-2 rounded hover:bg-blue-600 font-bold'>
                EXPORT NON INDEXED
              </button>
              <button
                onClick={() => handleExport('cart')}
                className='bg-blue-700 text-xs p-2 py-2 rounded hover:bg-blue-600 font-bold'>
                EXPORT SHOPPING CART
              </button>
            </div>
          </div>

          <div className='flex-1 flex flex-col h-full overflow-hidden'>
            {/*Board*/}
            <div className='flex-1 flex flex-col gap-1 overflow-y-auto'>
              {/* Grid 1: 24 slots total (Indices 0-23) */}
              <div className="flex-1 grid grid-rows-2 border-2 min-h-0">
                <div className='grid grid-cols-12 items-center justify-items-center'>
                  {renderSlots(12, 0)}
                </div>
                <div className="flex justify-between items-center px-4">
                  {renderSlots(6, 12)}
                  <HiddenCircle />
                  {renderSlots(6, 18)}
                </div>
              </div>

              {/* Grid 2: 14 slots (Indices 24-37) */}
              <div className="flex-1 grid grid-rows-2 border-2 min-h-0">
                <div className='grid grid-cols-7 items-center justify-items-center'>
                  {renderSlots(3, 24)}
                  <HiddenCircle />
                  {renderSlots(3, 27)}
                </div>
                <div className="flex justify-between items-center px-4">
                  {renderSlots(8, 30)}
                </div>
              </div>

              {/* Grid 3: 14 slots (Indices 38-51) */}
              <div className="flex-1 grid grid-rows-2 border-2 min-h-0">
                <div className='grid grid-cols-7 items-center justify-items-center'>
                  {renderSlots(3, 38)}
                  <HiddenCircle />
                  {renderSlots(3, 41)}
                </div>
                <div className="flex justify-between items-center px-4">
                  {renderSlots(8, 44)}
                </div>
              </div>

              {/* Grid 4: 14 slots (Indices 52-65) */}
              <div className="flex-1 grid grid-rows-2 border-2 min-h-0">
                <div className='grid grid-cols-7 items-center justify-items-center'>
                  {renderSlots(3, 52)}
                  <HiddenCircle />
                  {renderSlots(3, 55)}
                </div>
                <div className="flex justify-between items-center px-4">
                  {renderSlots(8, 58)}
                </div>
              </div>

              {/* Grid 5: 14 slots (Indices 66-79) */}
              <div className="flex-1 grid grid-rows-2 border-2 min-h-0">
                <div className='grid grid-cols-7 items-center justify-items-center'>
                  {renderSlots(3, 66)}
                  <HiddenCircle />
                  {renderSlots(3, 69)}
                </div>
                <div className="flex justify-between items-center px-4">
                  {renderSlots(8, 72)}
                </div>
              </div>

              {/* Grid 6: 25 slots (Indices 80-104) */}
              <div className="flex-1 grid grid-rows-2 border-2 min-h-0">
                <div className='grid grid-cols-12 items-center justify-items-center'>
                  {renderSlots(12, 80)}
                </div>
                <div className="flex justify-between items-center px-4">
                  {renderSlots(13, 92)}
                </div>
              </div>
            </div>

            {/*Paint Menu*/}
            <div className='flex-none h-[250px] border-2 wh-border-slate-400 p-4 mt-4 rounded-2xl flex flex-row gap-6 bg-slate-900'>
              {/*Paint Info*/}
              <div className='w-1/3 flex flex-row gap-4'>
                <div className='flex-1 flex flex-col justify-center min-w-0'>
                  <p className='font-bold text-lg text-slate-400'>Currently Selected</p>
                  {selectedPaint ? (
                    <div className='flex flex-col gap-2'>
                      <p className='truncate text-sm font-bold'>{selectedPaint.code}</p>
                      <p className='truncate text-xs text-slate-400'>{selectedPaint.name}</p>

                      {/* Inventory Controls */}
                      <div className='flex flex-col gap-1 mt-2'>
                        <p className='text-xs uppercase font-bold text-slate-500'>Inventory: {inventory[selectedPaint.code]?.qty || 0}</p>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => updateInventory(selectedPaint.code, 1)}
                            className='flex-1 bg-green-700 py-1 rounded hover:bg-green-600 text-sm font-bold'
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateInventory(selectedPaint.code, -1)}
                            className='flex-1 bg-red-700 py-1 rounded hover:bg-red-600 text-sm font-bold'
                          >
                            -
                          </button>
                        </div>
                      </div>

                      {/* Shopping Cart Controls */}
                      <div className='flex flex-col gap-1 mt-2 pt-2 border-t border-slate-700'>
                        <p className='text-xs uppercase font-bold text-slate-500'>Shopping List: {shoppingCart[selectedPaint.code]?.qty || 0}</p>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => updateShoppingCart(selectedPaint.code, 1)}
                            className='flex-1 bg-green-700 py-1 rounded hover:bg-green-600 text-sm font-bold'
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateShoppingCart(selectedPaint.code, -1)}
                            className='flex-1 bg-red-700 py-1 rounded hover:bg-red-600 text-sm font-bold'
                          >
                            -
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className='text-slate-500 italic text-sm'>No paint selected</p>
                  )}
                </div>
                {/*Add Paint*/}
                <div className='flex-1 border-l border-slate-700 pl-4 flex flex-col justify-center gap-2'>
                  <p className='font-bold text-sm text-slate-400'>Add New Paint</p>
                  <input
                    placeholder="Name"
                    className='bg-slate-800 text-white text-xs p-2 rounded border border-slate-700'
                    value={newPaint.name}
                    onChange={(e) => setNewPaint({ ...newPaint, name: e.target.value })}
                  />
                  <input
                    placeholder="Code (e.g. 69.429)"
                    className='bg-slate-800 text-white text-xs p-2 rounded border border-slate-700'
                    value={newPaint.code}
                    onChange={(e) => setNewPaint({ ...newPaint, code: e.target.value })}
                  />
                  <div className='flex gap-2 items-center'>
                    <input
                      type="color"
                      className='h-8 w-8 cursor-pointer bg-transparent border-none'
                      value={newPaint.hex}
                      onChange={(e) => setNewPaint({ ...newPaint, hex: e.target.value })}
                    />
                    <p className='text-xs text-slate-400 uppercase'>{newPaint.hex}</p>
                  </div>
                  <button
                    onClick={handleAddPaint}
                    className='bg-blue-700 text-xs py-2 rounded hover:bg-blue-600 font-bold'
                  >
                    ADD PAINT
                  </button>
                </div>
              </div>

              {/* Selkected Paint */}
              <div className='w-1/3 flex items-center justify-center border-x'>
                <SelectedPaint
                  paint={selectedPaint || { name: '', code: '', hex: 'transparent' }}
                  isNewSelection={isNewSelection}
                />
              </div>

              {/* Search */}
              <div className='w-1/3 flex flex-col overflow-hidden'>
                <p className='font-bold text-slate-400 mb-2'>Search</p>
                <div className='relative mb-2'>
                  <input
                    placeholder="Type code or name"
                    className='bg-slate-800 text-white text-sm p-2 rounded border border-slate-700 w-full pr-8'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white font-bold'
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className='overflow-y-auto flex-1 flex flex-col gap-1 pr-2'>
                  {filteredPaints.map(paint => (
                    <SearchCircle
                      key={paint.code}
                      paint={paint}
                      onClick={(p) => {
                        setSelectedPaint(p);
                        setIsNewSelection(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
