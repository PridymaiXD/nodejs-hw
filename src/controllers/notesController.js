import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

export const getAllNotes = async (req, res) => {
  const notes = await Note.find({ userId: req.user._id });
  res.status(200).json(notes);
};

export const getNoteById = async (req, res) => {
  const { id } = req.params;
  const note = await Note.findOne({ _id: id, userId: req.user._id });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const note = await Note.create({
    ...req.body,
    userId: req.user._id,
  });

  res.status(201).json(note);
};

export const updateNote = async (req, res) => {
  const { id } = req.params;
  const note = await Note.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    req.body,
    { new: true },
  );

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(200).json(note);
};

export const deleteNote = async (req, res) => {
  const { id } = req.params;
  const note = await Note.findOneAndDelete({ _id: id, userId: req.user._id });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  res.status(204).send();
};