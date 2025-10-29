import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Play, Pause, Settings, Download, Upload } from 'lucide-react';

export const TestComponents: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="p-8 space-y-8 bg-[var(--color-surface-primary)] min-h-screen">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">
        Alpine Graphite Neon Components Test
      </h1>

      {/* Button Tests */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Button Components</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Button Variants */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="primary" 
                  icon={isPlaying ? Pause : Play}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button variant="secondary" loading>Loading</Button>
                <Button variant="ghost" disabled>Disabled</Button>
                <Button variant="primary" icon={Settings}>With Icon</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card variant="default">
          <CardHeader>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Default Card</h3>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--color-text-secondary)]">
              This is a default card with standard elevation and styling.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="primary">Action</Button>
          </CardFooter>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Elevated Card</h3>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--color-text-secondary)]">
              This card has enhanced elevation and hover effects.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="secondary">Learn More</Button>
          </CardFooter>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Outlined Card</h3>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--color-text-secondary)]">
              This card uses outline styling with transparent background.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="ghost">View</Button>
          </CardFooter>
        </Card>

        <Card variant="glass" className="md:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-[var(--color-text-primary)]">Glass Card</h3>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--color-text-secondary)]">
              This card features a frosted glass effect with backdrop blur and semi-transparent background.
            </p>
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="primary" icon={Download}>Download</Button>
            <Button size="sm" variant="secondary" icon={Upload}>Upload</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Form Elements Test */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Form Elements</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Default Input
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter some text..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Small Input
              </label>
              <input 
                type="text" 
                className="form-input form-input--sm" 
                placeholder="Small input..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Large Input
              </label>
              <input 
                type="text" 
                className="form-input form-input--lg" 
                placeholder="Large input..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Error State
              </label>
              <input 
                type="text" 
                className="form-input form-input--error" 
                placeholder="This has an error..."
                defaultValue="Invalid input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Success State
              </label>
              <input 
                type="text" 
                className="form-input form-input--success" 
                placeholder="This is valid..."
                defaultValue="Valid input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Card */}
      <Card variant="elevated" role="button" className="cursor-pointer">
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Interactive Card
            </h3>
            <p className="text-[var(--color-text-secondary)]">
              Click me! I have hover and focus states.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};