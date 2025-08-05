// @AI-HINT: This file contains automated tests for the Messages page. It uses React Testing Library and Mock Service Worker (MSW) to simulate user interactions and verify that the component behaves as expected in a realistic, API-driven environment.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Messages from './Messages';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// The jest.setup.js file handles server.listen(), server.resetHandlers(), and server.close()

describe('Messages Page with MSW', () => {
  test('fetches and displays the conversation list', async () => {
    render(<Messages />);

    // Wait for the conversation list to be populated by MSW
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Williams')).toBeInTheDocument();
  });

  test('selects a conversation and displays its details', async () => {
    render(<Messages />);

    // Wait for the list and click a conversation
    const aliceConversation = await screen.findByText('Alice Johnson');
    fireEvent.click(aliceConversation);

    // Wait for the chat window to update with details from MSW
    expect(await screen.findByText(/Hey, are we still on for lunch tomorrow?/i)).toBeInTheDocument();
    expect(screen.getByText(/Yes, absolutely! Looking forward to it./i)).toBeInTheDocument();
  });

  test('sends a new message and updates the chat', async () => {
    render(<Messages />);

    // 1. Select a conversation
    const aliceConversation = await screen.findByText('Alice Johnson');
    fireEvent.click(aliceConversation);

    // 2. Wait for initial messages to appear
    await screen.findByText(/Yes, absolutely! Looking forward to it./i);

    // 3. Define the updated conversation that the GET request should return after the POST
    const updatedConversation = {
      id: 1,
      contactName: 'Alice Johnson',
      lastMessage: 'A new test message!',
      lastMessageTimestamp: '10:50 AM',
      unreadCount: 0,
      avatar: '/path/to/alice.png',
      messages: [
        { id: 101, text: 'Hey, are we still on for lunch tomorrow?', sender: 'contact', timestamp: '10:30 AM' },
        { id: 102, text: 'Yes, absolutely! Looking forward to it.', sender: 'user', timestamp: '10:32 AM' },
        { id: 103, text: 'A new test message!', sender: 'user', timestamp: '10:50 AM' },
      ],
    };

    // 4. Override the GET handler for the next request to return the updated data
    server.use(
      http.get('/api/messages/1', () => {
        return HttpResponse.json(updatedConversation);
      })
    );

    // 5. Type and send the new message
    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    fireEvent.change(input, { target: { value: 'A new test message!' } });
    fireEvent.click(sendButton);

    // 6. Wait for the new message to appear in the document
    expect(await screen.findByText('A new test message!')).toBeInTheDocument();
  });
});
