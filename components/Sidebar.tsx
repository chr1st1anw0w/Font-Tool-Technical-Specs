import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { UploadIcon, SparklesIcon, LayersIcon } from './icons';
import AIImportPanel from './AIImportPanel';
import LayerPanel from './LayerPanel';
import { Layer } from '../types';

interface SidebarProps {
    onSelectLetter: (key: string, svgString: string) => void;
    currentLetterKey: string | null;
    onImportSVG: (svgString: string) => void;
    // Layer props
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onReorderLayer: (id: string, direction: 'up' | 'down') => void;
    onSetActiveLayer: (id: string) => void;
}

// SKYWALK 字母的 SVG 數據
const letters: { [key: string]: string } = {
    'S': `<svg viewBox="0 0 652 706">
            <g fill="white">
                <rect id="s-right-stem" x="476" y="293" width="100" height="350"/>
                <rect id="s-left-stem" x="76" y="43" width="100" height="350"/>
                <path id="s-bottom-bar" d="M576 643H76V543H576V643Z"/>
                <path id="s-mid-bar" d="M576 393H76V293H576V393Z"/>
                <path id="s-top-bar" d="M576 143H76V43H576V143Z"/>
                <path id="s-corner-br" d="M576 643H426L576 493V643Z"/>
                <path id="s-corner-tr" d="M576 413L456 293H576V413Z"/>
                <path id="s-corner-bl" d="M226 393H76V243L226 393Z"/>
                <path id="s-corner-tl" d="M76 163.002V43.002H196L76 163.002Z"/>
            </g>
        </svg>`,
    'K': `<svg viewBox="0 0 493 601"><g transform="translate(-3279.11, -1.64062)"><path d="M3520.6 252.14H3530.53L3530.53 252.141H3589.11L3739.11 402.141V602.141H3639.11V352.141H3379.11V602.141H3279.11V2.14062H3379.11V252.141H3379.17L3629.31 3.54492L3771.09 1.64062L3520.6 252.14Z" fill="white"/></g></svg>`,
    'Y': `<svg viewBox="0 0 460 600"><g transform="translate(-1140.58, -2.14062)"><path d="M1240.58 252.141H1500.58V2.14062H1600.58V232.141L1480.58 352.141H1420.58V602.141H1320.58V352.141H1260.58L1140.58 232.141V2.14062H1240.58V252.141Z" fill="white"/></g></svg>`,
    'W': `<svg viewBox="0 0 560 600"><g transform="translate(-1678.58, -2.14062)"><path d="M1778.58 502.141H1908.58V2.14062H2008.58V502.141H2138.58V2.14062H2238.58V482.141L2118.58 602.141H2028.58L1958.58 532.141L1888.58 602.141H1798.58L1678.58 482.141V2.14062H1778.58V502.141Z" fill="white"/></g></svg>`,
    'A': `<svg viewBox="0 0 460 600"><g transform="translate(-2312.58, -2.14064)"><path d="M2672.58 352.141L2412.58 352.141L2412.58 602.141L2312.58 602.141L2312.58 122.141L2432.58 2.14065L2652.58 2.14064L2772.58 122.141L2772.58 602.141L2672.58 602.141L2672.58 352.141ZM2672.58 102.141L2412.58 102.141L2412.58 252.141L2672.58 252.141L2672.58 102.141Z" fill="white"/></g></svg>`,
    'L': `<svg viewBox="0 0 330 600"><g transform="translate(-2864.58, -2.14062)"><path d="M2964.58 502.141H3194.58V602.141H2984.58L2864.58 482.141V2.14062H2964.58V502.141Z" fill="white"/></g></svg>`,
};

const letterNames = ['S', 'K', 'Y', 'W', 'A', 'L'];

const LettersPanel: React.FC<Pick<SidebarProps, 'onSelectLetter' | 'currentLetterKey' | 'onImportSVG'>> = ({ onSelectLetter, currentLetterKey, onImportSVG }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pasteContent, setPasteContent] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImportSVG(e.target?.result as string);
            };
            reader.readAsText(file);
            event.target.value = ''; // Reset file input
        }
    };
    
    const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const content = e.target.value;
        setPasteContent(content);
        if (content.trim().startsWith('<svg')) {
             onImportSVG(content);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">字母</h3>
                <div className="grid grid-cols-3 gap-2">
                    {letterNames.map((letter) => (
                        <button
                            key={letter}
                            onClick={() => onSelectLetter(letter, letters[letter])}
                            className={clsx(
                                'h-16 rounded-lg flex items-center justify-center text-3xl font-bold font-sans transition-colors',
                                currentLetterKey === letter
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                            )}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            <AIImportPanel onImportSVG={onImportSVG} />

            <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">手動匯入</h3>
                <div className="space-y-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".svg"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                    >
                        <UploadIcon className="w-6 h-6 mb-1" />
                        <span className="text-sm font-medium">上傳檔案</span>
                    </button>
                    <div className="text-center text-gray-400 text-xs">或</div>
                    <textarea
                        value={pasteContent}
                        onChange={handlePasteChange}
                        placeholder="在此貼上 SVG 程式碼..."
                        className="w-full h-24 p-2 text-xs font-mono bg-white border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'letters' | 'layers'>('letters');
    
    return (
        <aside
            className="w-[256px] h-full bg-gray-50 flex flex-col overflow-y-auto"
            aria-label="Main Sidebar"
        >
            <div className="flex-shrink-0 border-b border-gray-200 flex">
                <TabButton 
                    label="字母" 
                    icon={<SparklesIcon className="w-4 h-4" />} 
                    isActive={activeTab === 'letters'} 
                    onClick={() => setActiveTab('letters')} 
                />
                <TabButton 
                    label="圖層" 
                    icon={<LayersIcon className="w-4 h-4" />} 
                    isActive={activeTab === 'layers'} 
                    onClick={() => setActiveTab('layers')} 
                />
            </div>
            
            <div className="flex-grow">
                {activeTab === 'letters' && (
                    <LettersPanel 
                        onSelectLetter={props.onSelectLetter}
                        currentLetterKey={props.currentLetterKey}
                        onImportSVG={props.onImportSVG}
                    />
                )}
                 {activeTab === 'layers' && (
                    <LayerPanel
                        layers={props.layers}
                        activeLayerId={props.activeLayerId}
                        onAddLayer={props.onAddLayer}
                        onDeleteLayer={props.onDeleteLayer}
                        onUpdateLayer={props.onUpdateLayer}
                        onReorderLayer={props.onReorderLayer}
                        onSetActiveLayer={props.onSetActiveLayer}
                    />
                )}
            </div>
        </aside>
    );
};

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors",
                isActive ? "text-blue-600 border-blue-600 bg-blue-50" : "text-gray-500 border-transparent hover:bg-gray-100"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

export default Sidebar;
