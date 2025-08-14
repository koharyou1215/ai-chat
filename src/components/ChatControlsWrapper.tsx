import ChatControls from './chat/ChatControls';

interface Character {
  name: string;
}

interface Persona {
  name: string;
}

interface ChatControlsWrapperProps {
  message: string;
  setMessage: (msg: string) => void;
  isLoading: boolean;
  onSendMessage: () => void;
  onOpenSettings: () => void;
  onOpenCharacterGallery: () => void;
  onOpenPersonaSelector: () => void;
  onOpenInspiration: () => void;
  onOpenTextEnhancement: () => void;
  onOpenTrackerPanel: () => void;
  showTrackerPanel: boolean;
  currentCharacter: Character | null;
  currentPersona: Persona | null;
}

const ChatControlsWrapper = (props: ChatControlsWrapperProps) => {
  return (
    <ChatControls {...props} />
  );
};

export default ChatControlsWrapper;
