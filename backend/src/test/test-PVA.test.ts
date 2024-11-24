import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { validateCandidateData } from '../application/validator';
import { addCandidate } from '../application/services/candidateService';
import { Candidate } from '../domain/models/Candidate';

// Mock de PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    candidate: {
      create: jest.fn(),
      findUnique: jest.fn()
    },
    education: {
      create: jest.fn()
    },
    workExperience: {
      create: jest.fn()
    },
    resume: {
      create: jest.fn()
    }
  }))
}));

describe('Test de Validación de Formulario', () => {
  const mockValidData = {
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan.perez@test.com",
    phone: "666777888",
    address: "Calle Test 123",
    educations: [{
      institution: "Universidad Test",
      title: "Ingeniería",
      startDate: "2020-01-01",
      endDate: "2024-01-01"
    }],
    workExperiences: [{
      company: "Empresa Test",
      position: "Desarrollador",
      description: "Desarrollo de aplicaciones",
      startDate: "2024-01-01",
      endDate: "2024-03-01"
    }]
  };

  test('debería validar datos correctos', () => {
    expect(() => validateCandidateData(mockValidData)).not.toThrow();
  });

  test('debería fallar con email inválido', () => {
    const invalidData = { ...mockValidData, email: 'invalid-email' };
    expect(() => validateCandidateData(invalidData)).toThrow('Invalid email');
  });

  test('debería fallar con teléfono inválido', () => {
    const invalidData = { ...mockValidData, phone: '123' };
    expect(() => validateCandidateData(invalidData)).toThrow('Invalid phone');
  });

  test('debería fallar con fecha inválida en educación', () => {
    const invalidData = {
      ...mockValidData,
      educations: [{
        ...mockValidData.educations[0],
        startDate: 'invalid-date'
      }]
    };
    expect(() => validateCandidateData(invalidData)).toThrow('Invalid date');
  });
});

describe('Test de Guardado en Base de Datos', () => {
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
  });

  test('debería guardar candidato completo', async () => {
    const mockCandidate = {
      id: 1,
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@test.com",
      phone: "666777888",
      address: "Calle Test 123"
    };

    prisma.candidate.create.mockResolvedValueOnce(mockCandidate);

    const result = await addCandidate(mockCandidate);
    expect(result).toBeDefined();
    expect(result.email).toBe(mockCandidate.email);
  });

  test('debería fallar al guardar email duplicado', async () => {
    const mockCandidate = {
      firstName: "Juan",
      lastName: "Pérez",
      email: "existing@test.com",
      phone: "666777888"
    };

    prisma.candidate.create.mockRejectedValueOnce({
      code: 'P2002',
      message: 'Unique constraint failed on the fields: (`email`)'
    });

    await expect(addCandidate(mockCandidate))
      .rejects
      .toThrow('The email already exists in the database');
  });
}); 