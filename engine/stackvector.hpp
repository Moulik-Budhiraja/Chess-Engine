#pragma once

#include <array>
#include <stdexcept>

using namespace std;

/**
 * @brief Fast array with some vector functions on stack, Implements only fast operations
 *
 *
 * @tparam T
 * @tparam N
 */
template <typename T, size_t _MaxCapacity>
class stackvector {
   private:
    size_t m_size = 0;
    array<T, _MaxCapacity> m_arr;

   public:
    using iterator = typename array<T, _MaxCapacity>::iterator;
    using const_iterator = typename array<T, _MaxCapacity>::const_iterator;

    stackvector() : m_size(0) {}
    stackvector(const stackvector& other) {
        m_size = other.m_size;
        m_arr = other.m_arr;
    };
    stackvector(stackvector&& other) noexcept = default;

    // Adds an item to the end of the array
    void push_back(T item) {
        if (m_size == _MaxCapacity) throw range_error("Max array size exceeded");

        m_arr[m_size] = item;
        m_size++;
    }

    // Removes the last item from the array
    T pop_back() {
        if (m_size == 0) throw range_error("Empty Array cannot be popped");

        m_size--;
        return m_arr[m_size];
    }

    template <size_t _OtherSize>
    void append(const stackvector<T, _OtherSize>& other) {
        if (other.size() + size() > _MaxCapacity) throw range_error("Max array size exceeded");

        for (T i : other) {
            m_arr[m_size] = i;
            m_size++;
        }
    }

    inline size_t size() const { return m_size; }
    inline bool empty() const { return m_size == 0; }
    constexpr size_t capacity() const { return _MaxCapacity; }

    // Provides access to elements by index
    T& operator[](std::size_t index) {
        if (index >= m_size) {
            throw std::out_of_range("Index out of range");
        }
        return m_arr[index];
    }

    const T& operator[](std::size_t index) const {
        if (index >= m_size) {
            throw std::out_of_range("Index out of range");
        }
        return m_arr[index];
    }

    // Iterators
    iterator begin() { return m_arr.begin(); }
    iterator end() { return m_arr.begin() + m_size; }

    const_iterator begin() const { return m_arr.begin(); }
    const_iterator end() const { return m_arr.begin() + m_size; }

    const_iterator cbegin() const { return m_arr.cbegin(); }
    const_iterator cend() const { return m_arr.cbegin() + m_size; }
};
