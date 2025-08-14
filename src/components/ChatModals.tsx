import SettingsModal from './SettingsModal';
import CharacterGallery from './CharacterGallery';
import InspirationPanel from './InspirationPanel';
import TrackerPanel from './TrackerPanel';
import CharacterEditModal from './CharacterEditModal';
import { BarChart3 } from 'lucide-react';

interface ChatModalsProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  currentPersona: any;
  personas: any[];
  setCurrentPersona: (p: any) => void;
  handlePersonaFileUpload: (file: File) => void;
  uploadingPersonaIcon: boolean;
  isCharacterGalleryOpen: boolean;
  setIsCharacterGalleryOpen: (open: boolean) => void;
  characters: any[];
  currentCharacter: any;
  setCurrentCharacter: (c: any) => void;
  setEditingCharacter: (c: any) => void;
  setIsCharacterEditOpen: (open: boolean) => void;
  initializeTrackers: (c: any) => void;
  showInspiration: boolean;
  setShowInspiration: (open: boolean) => void;
  inspirationText: string;
  setInspirationText: (t: string) => void;
  selectedText: string;
  setSelectedText: (t: string) => void;
  showTrackerPanel: boolean;
  setShowTrackerPanel: (open: boolean) => void;
  currentTrackers: any;
  setCurrentTrackers: (v: any) => void;
  isCharacterEditOpen: boolean;
  editingCharacter: any;
  saveCharacterData: () => void;
}

const ChatModals = (props: ChatModalsProps) => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    currentPersona,
    personas,
    setCurrentPersona,
    handlePersonaFileUpload,
    uploadingPersonaIcon,
    isCharacterGalleryOpen,
    setIsCharacterGalleryOpen,
    characters,
    currentCharacter,
    setCurrentCharacter,
    setEditingCharacter,
    setIsCharacterEditOpen,
    initializeTrackers,
    showInspiration,
    setShowInspiration,
    inspirationText,
    setInspirationText,
    selectedText,
    setSelectedText,
    showTrackerPanel,
    setShowTrackerPanel,
    currentTrackers,
    setCurrentTrackers,
    isCharacterEditOpen,
    editingCharacter,
    saveCharacterData,
  } = props;

  return <>
    <SettingsModal
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      currentPersona={currentPersona}
      personas={personas}
      onPersonaChange={setCurrentPersona}
      onPersonaFileUpload={handlePersonaFileUpload}
      uploadingPersonaIcon={uploadingPersonaIcon}
    />
    <CharacterGallery
      isOpen={isCharacterGalleryOpen}
      onClose={() => setIsCharacterGalleryOpen(false)}
      characters={characters}
      currentCharacter={currentCharacter}
      onCharacterSelect={setCurrentCharacter}
      onCharacterEdit={(character: any) => {
        setCurrentCharacter(character);
        setEditingCharacter(character);
        setIsCharacterEditOpen(true);
      }}
      initializeTrackers={initializeTrackers}
    />
    <InspirationPanel
      isOpen={showInspiration}
      onClose={() => setShowInspiration(false)}
      onGenerateInspiration={() => {
        // TODO: インスピレーション生成ロジックを実装
        console.log('インスピレーション生成:', inspirationText);
      }}
      onGenerateEnhancedImpression={() => {
        // TODO: 強化された印象生成ロジックを実装
        console.log('強化された印象生成:', selectedText);
      }}
      selectedText={selectedText}
      setSelectedText={setSelectedText}
      inspirationText={inspirationText}
      setInspirationText={setInspirationText}
    />
    <TrackerPanel
      isOpen={showTrackerPanel && currentCharacter?.trackers?.length > 0}
      onClose={() => setShowTrackerPanel(false)}
      trackers={currentCharacter?.trackers || []}
      currentValues={currentTrackers}
      onUpdateTracker={(name: string, value: any) => {
        setCurrentTrackers((prev: any) => ({ ...prev, [name]: value }));
      }}
      character={currentCharacter}
    />
    {currentCharacter && currentCharacter.trackers && currentCharacter.trackers.length > 0 && !showTrackerPanel && (
      <button
        onClick={() => setShowTrackerPanel(true)}
        className="fixed right-2 top-1/2 transform -translate-y-1/2 z-40 p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 hover:scale-110 shadow-lg"
      >
        <BarChart3 className="h-5 w-5 text-blue-400" />
      </button>
    )}
    {isCharacterEditOpen && editingCharacter && (
      <CharacterEditModal
        isOpen={isCharacterEditOpen}
        onClose={() => setIsCharacterEditOpen(false)}
        character={editingCharacter}
        onUpdateCharacter={(updatedCharacter: any) => setEditingCharacter(updatedCharacter)}
        onSave={saveCharacterData}
      />
    )}
  </>;
};

export default ChatModals;
