import { Position } from "../position";

describe("Position", () => {
  describe("constructor and basic properties", () => {
    it("should create a position with row and col", () => {
      const pos = new Position(3, 4);
      expect(pos.row).toBe(3);
      expect(pos.col).toBe(4);
    });
  });

  describe("isValid", () => {
    it("should return true for valid positions", () => {
      expect(new Position(0, 0).isValid()).toBe(true);
      expect(new Position(7, 7).isValid()).toBe(true);
      expect(new Position(3, 4).isValid()).toBe(true);
    });

    it("should return false for invalid positions", () => {
      expect(new Position(-1, 0).isValid()).toBe(false);
      expect(new Position(0, -1).isValid()).toBe(false);
      expect(new Position(8, 0).isValid()).toBe(false);
      expect(new Position(0, 8).isValid()).toBe(false);
      expect(new Position(10, 10).isValid()).toBe(false);
    });
  });

  describe("toAlgebraic", () => {
    it("should convert position to algebraic notation", () => {
      expect(new Position(0, 0).toAlgebraic()).toBe("a8");
      expect(new Position(0, 7).toAlgebraic()).toBe("h8");
      expect(new Position(7, 0).toAlgebraic()).toBe("a1");
      expect(new Position(7, 7).toAlgebraic()).toBe("h1");
      expect(new Position(3, 4).toAlgebraic()).toBe("e5");
    });
  });

  describe("fromAlgebraic", () => {
    it("should create position from algebraic notation", () => {
      const pos1 = Position.fromAlgebraic("a8");
      expect(pos1.row).toBe(0);
      expect(pos1.col).toBe(0);

      const pos2 = Position.fromAlgebraic("h1");
      expect(pos2.row).toBe(7);
      expect(pos2.col).toBe(7);

      const pos3 = Position.fromAlgebraic("e4");
      expect(pos3.row).toBe(4);
      expect(pos3.col).toBe(4);
    });

    it("should throw error for invalid notation", () => {
      expect(() => Position.fromAlgebraic("a")).toThrow();
      expect(() => Position.fromAlgebraic("a89")).toThrow();
      expect(() => Position.fromAlgebraic("")).toThrow();
    });
  });

  describe("offset", () => {
    it("should create new position with offset", () => {
      const pos = new Position(3, 3);
      const offset = pos.offset(1, 2);
      expect(offset.row).toBe(4);
      expect(offset.col).toBe(5);
      expect(pos.row).toBe(3); // original unchanged
    });
  });

  describe("toString", () => {
    it("should return algebraic notation", () => {
      expect(new Position(0, 0).toString()).toBe("a8");
      expect(new Position(7, 7).toString()).toBe("h1");
    });
  });

  describe("serializePosition", () => {
    it("should serialize position data", () => {
      const pos = new Position(3, 4);
      const data = pos.serializePosition();
      expect(data).toEqual({ row: 3, col: 4 });
    });
  });
});
