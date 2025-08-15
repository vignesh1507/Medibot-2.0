# TextType Component

A React component that creates a typewriter effect for text, displaying text character by character with customizable timing and cursor.

## Usage

```tsx
import TextType from '@/components/TextType';

<TextType 
  text={["Text typing effect", "for your websites", "Happy coding!"]}
  typingSpeed={75}
  pauseDuration={1500}
  showCursor={true}
  cursorCharacter="|"
  onComplete={() => console.log('Typing complete!')}
  className="text-lg font-bold"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string[]` | Required | Array of text strings to type out sequentially |
| `typingSpeed` | `number` | `75` | Delay between each character in milliseconds |
| `pauseDuration` | `number` | `1500` | Pause duration between different text strings in milliseconds |
| `showCursor` | `boolean` | `true` | Whether to show the blinking cursor |
| `cursorCharacter` | `string` | `"|"` | Character to use for the cursor |
| `onComplete` | `() => void` | `undefined` | Callback function called when all text has been typed |
| `className` | `string` | `""` | CSS classes to apply to the component |

## Features

- ✅ Sequential typing of multiple text strings
- ✅ Customizable typing speed and pause duration
- ✅ Blinking cursor animation
- ✅ Completion callback for chaining effects
- ✅ TypeScript support
- ✅ Responsive and accessible

## Integration with Chat

The TextType component is integrated into the chat system to provide a smooth typing effect for AI responses:

1. Responses are split into logical sentences
2. Each sentence is typed out sequentially
3. The cursor shows typing progress
4. Users can still interact with other features while typing occurs
