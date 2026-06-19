import { createContext, useReducer, useCallback } from 'react';

export const ChatContext = createContext(null);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadTotal: 0,
  loading: false,
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_UNREAD':
      return { ...state, unreadTotal: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const setConversations = useCallback((data) => {
    dispatch({ type: 'SET_CONVERSATIONS', payload: data });
  }, []);

  const setActiveConversation = useCallback((data) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: data });
  }, []);

  const setMessages = useCallback((data) => {
    dispatch({ type: 'SET_MESSAGES', payload: data });
  }, []);

  const addMessage = useCallback((message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const setUnreadTotal = useCallback((count) => {
    dispatch({ type: 'SET_UNREAD', payload: count });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        ...state,
        setConversations,
        setActiveConversation,
        setMessages,
        addMessage,
        setUnreadTotal,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
