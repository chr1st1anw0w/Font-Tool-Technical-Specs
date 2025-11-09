
import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { UploadIcon, SparklesIcon, PasteIcon } from './icons';
import AIImportPanel from './AIImportPanel';
import LayerPanel from './LayerPanel';
import { Layer } from '../types';

type SidebarTab = 'letters' | 'layers' | 'settings';

interface SidebarProps {
    activeTab: SidebarTab;
    onSelectLetter: (key: string, svgString: string) => void;
    currentLetterKey: string | null;
    onImportSVG: (svgString: string) => void;
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
    onReorderLayer: (id: string, direction: 'up' | 'down') => void;
    onSetActiveLayer: (id: string) => void;
}

const letters: { [key: string]: string } = {
    'S': `<svg viewBox="0 0 652 706"><g fill="white"><rect x="476" y="293" width="100" height="350"/><rect x="76" y="43" width="100" height="350"/><path d="M576 643H76V543H576V643Z"/><path d="M576 393H76V293H576V393Z"/><path d="M576 143H76V43H576V143Z"/><path d="M576 643H426L576 493V643Z"/><path d="M576 413L456 293H576V413Z"/><path d="M226 393H76V243L226 393Z"/><path d="M76 163V43H196L76 163Z"/></g></svg>`,
    'K': `<svg viewBox="0 0 493 601"><path d="M241.49 250.5H251.42V250.5H310L460 400.5V600.5H360V350.5H100V600.5H0V0.5H100V250.5H100.06L350.2 1.9043L491.98 -0.000183105L241.49 250.5Z" fill="white"/></svg>`,
    'Y': `<svg viewBox="0 0 460 600"><path d="M100 250H360V0H460V230L340 350H280V600H180V350H120L0 230V0H100V250Z" fill="white"/></svg>`,
    'W': `<svg viewBox="0 0 560 600"><path d="M100 500H230V0H330V500H460V0H560V480L440 600H350L280 530L210 600H120L0 480V0H100V500Z" fill="white"/></svg>`,
    'A': `<svg viewBox="0 0 460 600"><path d="M360 350L100 350L100 600H0L0 120L120 0L340 0L460 120L460 600H360L360 350ZM360 100L100 100L100 250L360 250L360 100Z" fill="white"/></svg>`,
    'L': `<svg viewBox="0 0 330 600"><path d="M100 500H330V600H120L0 480V0H100V500Z" fill="white"/></svg>`,
    // Added more letters for demo visually
    'B': `<svg viewBox="0 0 600 600"><path d="M0 0h450c82.84 0 150 67.16 150 150s-67.16 150-150 150v0c82.84 0 150 67.16 150 150S532.84 600 450 600H0V0z M100 100v150h350c27.61 0 50-22.39 50-50s-22.39-50-50-50H100z M100 350v150h350c27.61 0 50-22.39 50-50s-22.39-50-50-50H100z" fill="white"/></svg>`,
    'C': `<svg viewBox="0 0 600 600"><path d="M600 150v100H450c-82.84 0-150 67.16-150 150s67.16 150 150 150h150v100H450C201.47 650 0 448.53 0 200S201.47 -50 450 -50h150v100H450c-82.84 0-150 67.16-150 150s67.16 150 150 150h150z" fill="white"/></svg>`,
};

const letterNames = Object.keys(letters);

const LettersPanel: React.FC<Pick<SidebarProps, 'onSelectLetter' | 'currentLetterKey' | 'onImportSVG'>> = ({ onSelectLetter, currentLetterKey, onImportSVG }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImportSVG(e.target?.result as string);
            };
            reader.readAsText(file);
            event.target.value = ''; 
        }
    };

    const handlePasteClick = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.includes('<svg')) {
                onImportSVG(text);
            } else {
                console.warn("Clipboard does not contain valid SVG data.");
            }
        } catch (err) {
            console.error("Failed to read from clipboard:", err);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Quick Import Section */}
            <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Quick Import</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center h-10 bg-[var(--bg-input)] hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-color)] hover:border-[var(--border-highlight)] font-medium text-xs"
                    >
                        <UploadIcon className="w-4 h-4 mr-2 opacity-70" />
                        Upload
                    </button>
                    <button
                        onClick={handlePasteClick}
                        className="flex items-center justify-center h-10 bg-[var(--bg-input)] hover:bg-[var(--bg-panel-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-color)] hover:border-[var(--border-highlight)] font-medium text-xs"
                    >
                        <PasteIcon className="w-4 h-4 mr-2 opacity-70" />
                        Paste SVG
                    </button>
                </div>
            </div>

            {/* Presets Section */}
            <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Resources</h3>
                <div className="grid grid-cols-4 gap-2">
                    {letterNames.map((letter) => (
                        <button
                            key={letter}
                            onClick={() => onSelectLetter(letter, letters[letter])}
                            className={clsx(
                                'aspect-square rounded-xl flex items-center justify-center text-xl font-bold font-sans transition-all duration-200',
                                currentLetterKey === letter
                                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)] hover:text-white border border-transparent hover:border-[var(--border-highlight)]'
                            )}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
                 <AIImportPanel onImportSVG={onImportSVG} />
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept=".svg" onChange={handleFileChange} />
        </div>
    );
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    return (
        <div className="h-full flex flex-col bg-[var(--bg-panel)]">
            <div className="h-14 flex-shrink-0 flex items-center px-5 border-b border-[var(--border-color)]">
                <h2 className="font-semibold text-[var(--text-primary)] tracking-tight">
                    {props.activeTab === 'letters' && 'Assets Library'}
                    {props.activeTab === 'layers' && 'Layers'}
                    {props.activeTab === 'settings' && 'Settings'}
                </h2>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                {props.activeTab === 'letters' && (
                    <LettersPanel 
                        onSelectLetter={props.onSelectLetter}
                        currentLetterKey={props.currentLetterKey}
                        onImportSVG={props.onImportSVG}
                    />
                )}
                 {props.activeTab === 'layers' && (
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
                {props.activeTab === 'settings' && (
                    <div className="p-5 text-[var(--text-secondary)] text-sm">
                        Settings panel placeholder.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
