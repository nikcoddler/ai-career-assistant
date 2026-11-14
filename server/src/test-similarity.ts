import { cosineSimilarity } from "./services/similarity.service.js";

const vectorA = [1, 0];
const vectorB = [1, 0];
const vectorC = [0, 1];
const vectorD = [-1, 0];

console.log("Same direction:", cosineSimilarity(vectorA, vectorB));

console.log("Perpendicular:", cosineSimilarity(vectorA, vectorC));

console.log("Opposite direction:", cosineSimilarity(vectorA, vectorD));
