# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an IoT server that receives sensor data from ESP32 devices. It's a Node.js/Express server that acts as a data ingestion endpoint for weather/sensor data.

## Commands

- **Start server:** `npm start` (runs on port 4000, binds to 0.0.0.0 for external connections)
- **Install dependencies:** `npm install`

## Architecture

Single-file Express server (`server.js`) with one POST endpoint:
- `POST /api/data` - Receives JSON sensor data from ESP32 devices, logs it, and returns a success response

The server is designed to be extended with an LLM integration (placeholder exists for `generateStory()` function using Gemini API).

## Environment Variables

- `GEMINI_API_KEY` - API key for Gemini (stored in `.env`, loaded via dotenv)
