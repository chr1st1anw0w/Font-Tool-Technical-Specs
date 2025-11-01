import React, { useRef } from 'react';
import type { ViewOptions } from '../types';
import { UploadIcon, CodeIcon, DownloadIcon, CopyIcon, PlusIcon, MinusIcon, ArrowsExpandIcon } from './icons';

interface FooterProps {
    onImportSVG: (svgString: string) => void;
    onExportSVG: () => void;
    onExportPNG: () => void;
    onCopySVG: () => void;
    viewOptions: ViewOptions;
    onViewOptionsChange: (options: Partial<ViewOptions>) => void;
    hasContent: boolean;
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

const FooterButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
    isIcon?: boolean;
}> = ({ onClick, children, title, disabled = false, isIcon = false }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`secondary-button flex items-center ${isIcon ? 'px-2' : 'space-x-2'}`}
    >
        {children}
    </button>
);


const Footer: React.FC<FooterProps> = ({
    onImportSVG,
    onExportSVG,
    onExportPNG,
    onCopySVG,
    viewOptions,
    onViewOptionsChange,
    hasContent,
    zoomLevel,
    onZoomIn,
    onZoomOut,
    onZoomReset
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImportSVG(e.target?.result as string);
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div className="h-[48px] bg-[var(--neutral-gray-900)] border-t border-[var(--neutral-gray-700)] flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".svg"
                    onChange={handleFileChange}
                />
                <FooterButton title="Import SVG File" onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon />
                    <span>Import</span>
                </FooterButton>
                <FooterButton title="Paste SVG Code" onClick={() => onViewOptionsChange({ previewMode: true })}>
                     <CodeIcon />
                     <span>Paste</span>
                </FooterButton>
            </div>

            <div className="flex items-center space-x-2">
                 <FooterButton title="Zoom Out" onClick={onZoomOut} isIcon>
                    <MinusIcon />
                </FooterButton>
                 <div className="px-3 py-1.5 text-sm font-medium text-center text-gray-300 bg-gray-700 rounded-md w-20" title="Current Zoom">
                    {Math.round(zoomLevel * 100)}%
                </div>
                 <FooterButton title="Zoom In" onClick={onZoomIn} isIcon>
                    <PlusIcon />
                </FooterButton>
                 <FooterButton title="Fit to View" onClick={onZoomReset} isIcon disabled={!hasContent}>
                    <ArrowsExpandIcon />
                </FooterButton>
            </div>

            <div className="flex items-center space-x-2">
                 <FooterButton title="Export as PNG" onClick={onExportPNG} disabled={!hasContent}>
                    <DownloadIcon />
                    <span>PNG</span>
                </FooterButton>
                 <FooterButton title="Export as SVG" onClick={onExportSVG} disabled={!hasContent}>
                    <DownloadIcon />
                    <span>SVG</span>
                </FooterButton>
                 <FooterButton title="Copy SVG Code" onClick={onCopySVG} disabled={!hasContent}>
                    <CopyIcon />
                    <span>Copy</span>
                </FooterButton>
            </div>
        </div>
    );
};

export default Footer;