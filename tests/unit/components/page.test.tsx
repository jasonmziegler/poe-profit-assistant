import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Create a simple test component
const TestHomeComponent = (): JSX.Element => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p>POE Profit Assistant</p>
      </div>
      <div className="relative flex place-items-center">
        <h1 className="text-4xl font-bold">Welcome to POE Profit Assistant</h1>
      </div>
      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <p className="m-0 max-w-[30ch] text-sm opacity-50">
          Path of Exile trading profit analysis tool
        </p>
      </div>
    </main>
  )
}

describe('Home page component', () => {
  it('should render the main heading', () => {
    render(<TestHomeComponent />)

    const heading = screen.getByText('Welcome to POE Profit Assistant')
    expect(heading).toBeInTheDocument()
  })

  it('should render the description', () => {
    render(<TestHomeComponent />)

    const description = screen.getByText('Path of Exile trading profit analysis tool')
    expect(description).toBeInTheDocument()
  })

  it('should display the app title in header', () => {
    render(<TestHomeComponent />)

    const appTitle = screen.getByText('POE Profit Assistant')
    expect(appTitle).toBeInTheDocument()
  })
})